import { Readable } from "stream";
import cosmiconfig from "cosmiconfig";
import createThrottle from "async-throttle";
import defaultMetadataProvider from "svgicons2svgfont/src/metadata";
import fileSorter from "svgicons2svgfont/src/filesorter";
import fs from "fs";
import globby from "globby";
import merge from "merge-deep";
import nunjucks from "nunjucks";
import os from "os";
import path from "path";
import svg2ttf from "svg2ttf";
import svgicons2svgfont from "svgicons2svgfont";
import ttf2eot from "ttf2eot";
import ttf2woff from "ttf2woff";
import ttf2woff2 from "ttf2woff2";
import xml2js from "xml2js";

function getGlyphsData(files, options) {
  const metadataProvider =
    options.metadataProvider ||
    defaultMetadataProvider({
      prependUnicode: options.prependUnicode,
      startUnicode: options.startUnicode
    });

  const sortedFiles = files.sort((fileA, fileB) => fileSorter(fileA, fileB));
  const xmlParser = new xml2js.Parser();
  const throttle = createThrottle(options.maxConcurrency);

  return Promise.all(
    sortedFiles.map(srcPath =>
      throttle(
        () =>
          new Promise((resolve, reject) => {
            const glyph = fs.createReadStream(srcPath);
            let glyphContents = "";

            return glyph
              .on("error", glyphError => reject(glyphError))
              .on("data", data => {
                glyphContents += data.toString();
              })
              .on("end", () => {
                // Maybe bug in xml2js
                if (glyphContents.length === 0) {
                  return reject(new Error(`Empty file ${srcPath}`));
                }

                return xmlParser.parseString(glyphContents, error => {
                  if (error) {
                    return reject(error);
                  }

                  const glyphData = {
                    contents: glyphContents,
                    srcPath
                  };

                  return resolve(glyphData);
                });
              });
          })
      ).then(
        glyphData =>
          new Promise((resolve, reject) => {
            metadataProvider(glyphData.srcPath, (error, metadata) => {
              if (error) {
                return reject(error);
              }

              glyphData.metadata = metadata;

              return resolve(glyphData);
            });
          })
      )
    )
  );
}

function svgIcons2svgFontFn(glyphsData, options) {
  let result = "";

  return new Promise((resolve, reject) => {
    const fontStream = svgicons2svgfont({
      ascent: options.ascent,
      centerHorizontally: options.centerHorizontally,
      descent: options.descent,
      fixedWidth: options.fixedWidth,
      fontHeight: options.fontHeight,
      fontId: options.fontId,
      fontName: options.fontName,
      fontStyle: options.fontStyle,
      fontWeight: options.fontWeight,
      // eslint-disable-next-line no-console, no-empty-function
      log: options.vebose ? console.log.bind(console) : () => {},
      metadata: options.metadata,
      normalize: options.normalize,
      round: options.round
    })
      .on("finish", () => resolve(result))
      .on("data", data => {
        result += data;
      })
      .on("error", error => reject(error));

    glyphsData.forEach(glyphData => {
      const glyphStream = new Readable();

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);

      glyphStream.metadata = glyphData.metadata;

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
}

function buildConfig(options) {
  const cosmiconfigOptions = {
    argv: true,
    // Allow extensions on rc filenames
    rcExtensions: true
  };

  let searchPath = process.cwd();
  let configPath = null;

  if (options.configFile) {
    searchPath = null;
    configPath = path.resolve(process.cwd(), options.configFile);
  }

  return cosmiconfig("webfont", cosmiconfigOptions)
    .load(searchPath, configPath)
    .then(result => {
      if (!result) {
        return {};
      }

      return result.config;
    });
}

export default function(initialOptions) {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  const { files } = initialOptions;

  let options = Object.assign(
    {},
    {
      ascent: undefined, // eslint-disable-line no-undefined
      centerHorizontally: false,
      cssTemplateClassName: null,
      cssTemplateFontName: null,
      cssTemplateFontPath: "./",
      descent: 0,
      fixedWidth: false,
      fontHeight: null,
      fontId: null,
      fontName: "webfont",
      fontStyle: "",
      fontWeight: "",
      formats: ["svg", "ttf", "eot", "woff", "woff2"],
      formatsOptions: {
        ttf: {
          copyright: null,
          ts: null,
          version: null
        }
      },
      glyphTransformFn: null,
      // Maybe allow setup from CLI
      maxConcurrency: os.cpus().length,
      metadata: null,
      metadataProvider: null,
      normalize: false,
      prependUnicode: false,
      round: 10e12,
      // eslint-disable-next-line prettier/prettier
      startUnicode: 0xea01,
      template: null,
      verbose: false
    },
    initialOptions
  );

  let glyphsData = [];

  return buildConfig({
    configFile: options.configFile
  }).then(loadedConfig => {
    options = merge({}, options, loadedConfig);

    return (
      globby([].concat(files))
        .then(foundFiles => {
          const filteredFiles = foundFiles.filter(
            foundFile => path.extname(foundFile) === ".svg"
          );

          if (filteredFiles.length === 0) {
            throw new Error(
              "Files glob patterns specified did not match any files"
            );
          }

          options.foundFiles = foundFiles;

          return getGlyphsData(foundFiles, options);
        })
        .then(returnedGlyphsData => {
          glyphsData = returnedGlyphsData;

          return svgIcons2svgFontFn(returnedGlyphsData, options);
        })
        // Maybe add ttfautohint
        .then(svgFont => {
          const result = {};

          result.svg = svgFont;

          result.ttf = Buffer.from(
            svg2ttf(
              result.svg.toString(),
              options.formatsOptions && options.formatsOptions.ttf
                ? options.formatsOptions.ttf
                : {}
            ).buffer
          );

          if (options.formats.indexOf("eot") !== -1) {
            result.eot = Buffer.from(ttf2eot(result.ttf).buffer);
          }

          if (options.formats.indexOf("woff") !== -1) {
            result.woff = Buffer.from(
              ttf2woff(result.ttf, {
                metadata: options.metadata
              }).buffer
            );
          }

          if (options.formats.indexOf("woff2") !== -1) {
            result.woff2 = ttf2woff2(result.ttf);
          }

          return result;
        })
        .then(result => {
          if (!options.template) {
            return result;
          }

          const buildInTemplateDirectory = path.resolve(
            __dirname,
            "../templates"
          );

          return globby(
            `${buildInTemplateDirectory}/**/*`
          ).then(buildInTemplates => {
            const supportedExtensions = buildInTemplates.map(buildInTemplate =>
              path.extname(buildInTemplate.replace(".njk", ""))
            );

            let templateFilePath = options.template;

            if (supportedExtensions.indexOf(`.${options.template}`) !== -1) {
              result.usedBuildInStylesTemplate = true;

              nunjucks.configure(path.join(__dirname, "../"));

              templateFilePath = `${buildInTemplateDirectory}/template.${options.template}.njk`;
            } else {
              templateFilePath = path.resolve(templateFilePath);
            }

            const nunjucksOptions = merge(
              {},
              {
                // Maybe best solution is return metadata object of glyph.
                glyphs: glyphsData.map(glyphData => {
                  if (typeof options.glyphTransformFn === "function") {
                    options.glyphTransformFn(glyphData.metadata);
                  }

                  return glyphData.metadata;
                })
              },
              options,
              {
                className: options.cssTemplateClassName
                  ? options.cssTemplateClassName
                  : options.fontName,
                fontName: options.cssTemplateFontName
                  ? options.cssTemplateFontName
                  : options.fontName,
                fontPath: options.cssTemplateFontPath
              }
            );

            result.styles = nunjucks.render(templateFilePath, nunjucksOptions);

            return result;
          });
        })
        .then(result => {
          if (options.formats.indexOf("svg") === -1) {
            delete result.svg;
          }

          if (options.formats.indexOf("ttf") === -1) {
            delete result.ttf;
          }

          result.config = options;

          return result;
        })
    );
  });
}
