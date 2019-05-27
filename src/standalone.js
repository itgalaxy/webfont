import { Readable } from "stream";
import fs from "fs";
import path from "path";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import cosmiconfig from "cosmiconfig";
import pLimit from "p-limit";
import defaultTtfMetadataProvider from "ttfinfo";
import defaultSvgMetadataProvider from "svgicons2svgfont/src/metadata";
import fileSorter from "svgicons2svgfont/src/filesorter";
import globby from "globby";
import deepmerge from "deepmerge";
import nunjucks from "nunjucks";
import svg2ttf from "svg2ttf";
import ttf2eot from "ttf2eot";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import xml2js from "xml2js";

async function buildConfig(options) {
  let searchPath = process.cwd();
  let configPath = null;

  if (options.configFile) {
    searchPath = null;
    configPath = path.resolve(process.cwd(), options.configFile);
  }

  const configExplorer = cosmiconfig("webfont");
  const config = await (configPath
    ? configExplorer.load(configPath)
    : configExplorer.search(searchPath));

  if (!config) {
    return {};
  }

  return config;
}

function getGlyphsData(files, options) {
  const metadataProvider =
    options.svgMetadataProvider ||
    defaultSvgMetadataProvider({
      prependUnicode: options.prependUnicode,
      startUnicode: options.startUnicode
    });

  const xmlParser = new xml2js.Parser();
  const throttle = pLimit(options.maxConcurrency);

  return Promise.all(
    files.map(srcPath =>
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
      )
    )
  ).then(glyphsData => {
    const sortedGlyphsData = options.sort
      ? glyphsData.sort((fileA, fileB) =>
          fileSorter(fileA.srcPath, fileB.srcPath)
        )
      : glyphsData;

    return Promise.all(
      sortedGlyphsData.map(
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
    );
  });
}

function getFontsData(files, options) {
  const metadataProvider =
    options.ttfMetadataProvider ||
    defaultTtfMetadataProvider;

  const throttle = pLimit(options.maxConcurrency);

  return Promise.all(
    files.map(srcPath =>
      throttle(
        () =>
          new Promise((resolve, reject) => {
            const font = fs.createReadStream(srcPath);
            let chunks = [];

            return font
              .on("error", glyphError => reject(glyphError))
              .on("data", data => {chunks.push(data);})
              .on("end", () => {
                if (chunks.length === 0) {
                  return reject(new Error(`Empty file ${srcPath}`));
                }
                const fontData = {
                  srcPath,
                  contents: Buffer.concat(chunks),
                };
                return resolve(fontData);
              });
          })
      )
    )
  ).then(fontsData => {
    const sortedFontsData = options.sort
      ? fontsData.sort((fileA, fileB) =>
        fileSorter(fileA.srcPath, fileB.srcPath)
      )
      : fontsData;

    return Promise.all(
      sortedFontsData.map(
        fontData =>
          new Promise((resolve, reject) => {
            metadataProvider(fontData.srcPath, (error, metadata) => {
              if (error) {
                return reject(error);
              }

              fontData.metadata = {
                family: metadata.tables.name[1],
                style: metadata.tables.post.italicAngle ? 'italic' : 'normal',
                weight: Math.round(metadata.tables['OS/2'].weightClass / 100) * 100,
                local1: metadata.tables.name[4],
                local2: metadata.tables.name[6],
                weightClass: metadata.tables['OS/2'].weightClass,
                italicAngle: metadata.tables.post.italicAngle,
                underlinePosition: metadata.tables.post.underlinePosition,
                underlineThickness: metadata.tables.post.underlineThickness,
                fileName: path.basename(fontData.srcPath, '.ttf'),
              };

              return resolve(fontData);
            });
          })
      )
    );
  });
}

function toSvg(glyphsData, options) {
  let result = "";

  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFontStream({
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
      log: options.verbose ? console.log.bind(console) : () => {},
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

function toTtf(buffer, options) {
  return Buffer.from(svg2ttf(buffer, options).buffer);
}

function toEot(buffer) {
  return Buffer.from(ttf2eot(buffer).buffer);
}

function toWoff(buffer, options) {
  return Buffer.from(ttf2woff(buffer, options).buffer);
}

function toWoff2(buffer) {
  return wawoff2.compress(buffer);
}

export default async function(initialOptions) {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  let options = Object.assign(
    {},
    {
      ascent: undefined, // eslint-disable-line no-undefined
      centerHorizontally: false,
      descent: 0,
      ttfMode: false,
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
      fontTransformFn: null,
      // Maybe allow setup from CLI
      // This is usually less than file read maximums while staying performance
      maxConcurrency: 100,
      metadata: null,
      svgMetadataProvider: null,
      ttfMetadataProvider: null,
      normalize: false,
      prependUnicode: false,
      round: 10e12,
      sort: true,
      startUnicode: 0xea01,
      template: null,
      templateClassName: null,
      templateFontName: null,
      templateFontPath: "./",
      verbose: false
    },
    initialOptions
  );

  const config = await buildConfig({
    configFile: options.configFile
  });

  if (Object.keys(config).length > 0) {
    options = deepmerge(options, config.config);
    options.filePath = config.filepath;
  }

  const foundFiles = await globby([].concat(options.files));

  const filteredFiles = foundFiles.filter(
    foundFile => path.extname(foundFile) === (options.ttfMode ? ".ttf" : ".svg")
  );

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  const result = {};

  if (!options.ttfMode) {

    result.glyphsData = await getGlyphsData(filteredFiles, options);
    result.svg = await toSvg(result.glyphsData, options);

    result.ttf = toTtf(
      result.svg,
      options.formatsOptions && options.formatsOptions.ttf
        ? options.formatsOptions.ttf
        : {}
    );

    if (options.formats.includes("eot")) {
      result.eot = toEot(result.ttf);
    }

    if (options.formats.includes("woff")) {
      result.woff = toWoff(result.ttf, { metadata: options.metadata });
    }

    if (options.formats.includes("woff2")) {
      result.woff2 = await toWoff2(result.ttf);
    }

  } else {

    result.fontsData = await getFontsData(filteredFiles, options);

    result.ttf = result.fontsData.map(fontData => ({
      name: fontData.srcPath,
      buffer: fontData.contents,
    }));

    if (options.formats.includes("eot")) {
      result.eot = result.ttf.map(file => ({
        name: file.name.replace(/\.ttf$/, '.eot'),
        buffer: toEot(file.buffer),
      }));
    }

    if (options.formats.includes("woff")) {
      result.woff = result.ttf.map(file => ({
        name: file.name.replace(/\.ttf$/, '.woff'),
        buffer: toWoff(file.buffer, { metadata: options.metadata }),
      }));
    }

    if (options.formats.includes("woff2")) {

      // IMPORTANT!

      // Woff2 is hard on CPU due to it's sophisticated compression algorithms.
      // As a result, it literally 'hangs' main thread for a few seconds while
      // processing a standard TTF fonts. On a MacBook Pro 2015 it takes around
      // 6 seconds to compress 4 TTF files 250Kb each.

      // Recommended solution here is:
      // 1) Use WOFF2 compression in production only
      // 2) Implement parallel background processing

      // console.log('Start WOFF2');
      // console.time('WOFF2');

      result.woff2 = await Promise.all(result.ttf.map(async file => ({
        name: file.name.replace(/\.ttf$/, '.woff2'),
        buffer: await toWoff2(file.buffer),
      })));

      // console.timeEnd('WOFF2');
      // console.log('End WOFF2');
    }

  }

  if (options.template) {
    const templateFileName = !options.ttfMode ? "icons" : "fonts";
    const templateDirectory = path.resolve(__dirname, "../templates");
    const buildInTemplates = {
      css: { path: path.join(templateDirectory, `${templateFileName}.css.njk`) },
      html: { path: path.join(templateDirectory, `${templateFileName}.html.njk`) },
      scss: { path: path.join(templateDirectory, `${templateFileName}.scss.njk`) }
    };

    let templateFilePath = null;

    if (Object.keys(buildInTemplates).includes(options.template)) {
      result.usedBuildInTemplate = true;

      nunjucks.configure(path.resolve(__dirname, "../"));

      templateFilePath = `${templateDirectory}/${templateFileName}.${
        options.template
      }.njk`;
    } else {
      const resolvedTemplateFilePath = path.resolve(options.template);

      nunjucks.configure(path.dirname(resolvedTemplateFilePath));

      templateFilePath = path.resolve(resolvedTemplateFilePath);
    }

    const metadata = !options.ttfMode ? {
      glyphs: result.glyphsData.map(glyphData => {
        if (typeof options.glyphTransformFn === "function") {
          glyphData.metadata = options.glyphTransformFn(glyphData.metadata);
        }
        return glyphData.metadata;
      })
    } : {
      fonts: result.fontsData.map(fontData => {
        if (typeof options.fontTransformFn === "function") {
          fontData.metadata = options.fontTransformFn(fontData.metadata);
        }
        return fontData.metadata;
      })
    };

    const nunjucksOptions = deepmerge.all([
      metadata,
      options,
      {
        className: options.templateClassName || options.fontName,
        fontName: options.templateFontName || options.fontName,
        fontPath: options.templateFontPath.replace(/\/?$/, "/")
      }
    ]);

    result.template = nunjucks.render(templateFilePath, nunjucksOptions);
  }

  if (!options.formats.includes("svg")) {
    delete result.svg;
  }

  if (!options.formats.includes("ttf")) {
    delete result.ttf;
  }

  result.config = options;

  return result;
}
