import { Readable } from "stream";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import cosmiconfig from "cosmiconfig";
import pLimit from "p-limit";
import defaultMetadataProvider from "svgicons2svgfont/src/metadata";
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
    options.metadataProvider ||
    defaultMetadataProvider({
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
      // This is usually less than file read maximums while staying performance
      maxConcurrency: 100,
      metadata: null,
      metadataProvider: null,
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
    foundFile => path.extname(foundFile) === ".svg"
  );

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  const result = {};

  result.glyphsData = await getGlyphsData(filteredFiles, options);
  result.svg = await toSvg(result.glyphsData, options);
  result.ttf = toTtf(
    result.svg,
    options.formatsOptions && options.formatsOptions.ttf
      ? options.formatsOptions.ttf
      : {}
  );

  result.hash = crypto
    .createHash("md5")
    .update(result.svg)
    .digest("hex");

  if (options.formats.includes("eot")) {
    result.eot = toEot(result.ttf);
  }

  if (options.formats.includes("woff")) {
    result.woff = toWoff(result.ttf, { metadata: options.metadata });
  }

  if (options.formats.includes("woff2")) {
    result.woff2 = await toWoff2(result.ttf);
  }

  if (options.template) {
    const templateDirectory = path.resolve(__dirname, "../templates");
    const buildInTemplates = {
      css: { path: path.join(templateDirectory, "template.css.njk") },
      html: { path: path.join(templateDirectory, "template.html.njk") },
      scss: { path: path.join(templateDirectory, "template.scss.njk") }
    };

    let templateFilePath = null;

    if (Object.keys(buildInTemplates).includes(options.template)) {
      result.usedBuildInTemplate = true;

      nunjucks.configure(path.resolve(__dirname, "../"));

      templateFilePath = `${templateDirectory}/template.${
        options.template
      }.njk`;
    } else {
      const resolvedTemplateFilePath = path.resolve(options.template);

      nunjucks.configure(path.dirname(resolvedTemplateFilePath));

      templateFilePath = path.resolve(resolvedTemplateFilePath);
    }

    const hashOption = options.addHashInFontUrl ? { hash: result.hash } : {};
    const nunjucksOptions = deepmerge.all([
      {
        glyphs: result.glyphsData.map(glyphData => {
          if (typeof options.glyphTransformFn === "function") {
            glyphData.metadata = options.glyphTransformFn(glyphData.metadata);
          }

          return glyphData.metadata;
        })
      },
      options,
      {
        className: options.templateClassName || options.fontName,
        fontName: options.templateFontName || options.fontName,
        fontPath: options.templateFontPath.replace(/\/?$/, "/")
      },
      hashOption
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
