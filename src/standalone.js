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

const HASH_ALGORITHM       = 'md5';
const HASH_DIGEST_ENCODING = 'hex';

export const FORMATS = ["svg", "ttf", "eof", "woff", "woff2"];
export const TEMPLATES = ["css", "scss", "styl", "html"];

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

/**
 * @param {string[]} files
 * @param {Object}   options
 * @returns {Promise<WebfontGlyphsData[]>}
 */
function getGlyphsData(files, options) {
  if (options.verbose) { console.log(`Rendering glyphs for '${options.fontName}'`); }

  const metadataProvider =
    options.metadataProvider ||
    defaultMetadataProvider({
      prependUnicode: options.prependUnicode,
      startUnicode: options.startUnicode,
    });

  const xmlParser = new xml2js.Parser();
  const throttle = pLimit(options.maxConcurrency);

  return Promise.all(
    files.map((srcPath) =>
      throttle(
        () =>
          new Promise((resolve, reject) => {
            const glyph = fs.createReadStream(srcPath);
            let glyphContents = "";

            // eslint-disable-next-line no-promise-executor-return
            return glyph
              .on("error", (glyphError) => reject(glyphError))
              .on("data", (data) => {
                glyphContents += data.toString();
              })
              .on("end", () => {
                // Maybe bug in xml2js
                if (glyphContents.length === 0) {
                  return reject(new Error(`Empty file ${srcPath}`));
                }

                return xmlParser.parseString(glyphContents, (error) => {
                  if (error) {
                    return reject(error);
                  }

                  const glyphData = {
                    contents: glyphContents,
                    srcPath,
                  };

                  return resolve(glyphData);
                });
              });
          })
      )
    )
  ).then((glyphsData) => {
    const sortedGlyphsData = options.sort
      ? glyphsData.sort((fileA, fileB) =>
          fileSorter(fileA.srcPath, fileB.srcPath)
        )
      : glyphsData;

    return Promise.all(
      sortedGlyphsData.map(
        (glyphData) =>
          new Promise((resolve, reject) => {
            metadataProvider(glyphData.srcPath, (error, metadata) => {
              if (error) {
                return reject(error);
              }

              metadata.unicode.push(metadata.name.replace(/-/g, "_"));
              glyphData.metadata = metadata;

              return resolve(glyphData);
            });
          })
      )
    );
  });
}

/**
 * @param {WebfontGlyphsData[]} glyphsData
 * @param {Object}              options
 * @returns {Promise<string>}
 */
function toSvg(glyphsData, options) {
  const renderMsgHint = options.formats.includes('svg') ? '' : ' (internal base for further rendering)';
  if (options.verbose) { console.log(`Rendering svg format for '${options.fontName}'${renderMsgHint}`); }

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
      round: options.round,
    })
      .on("finish", () => resolve(result))
      .on("data", (data) => {
        result += data;
      })
      .on("error", (error) => reject(error));

    glyphsData.forEach((glyphData) => {
      const glyphStream = new Readable();

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);

      glyphStream.metadata = glyphData.metadata;

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
}

function toTtf(string, options) {
  const renderMsgHint = options.formats.includes('ttf') ? '' : ' (internal base for further rendering)';
  if (options.verbose) { console.log(`Rendering ttf format for '${options.fontName}'${renderMsgHint}`); }

  return Buffer.from(
    svg2ttf(
      string,
      options.formatsOptions && options.formatsOptions.ttf
        ? options.formatsOptions.ttf
        : {})
    .buffer);
}

function toEot(buffer, options) {
  if (options.verbose) { console.log(`Rendering eof format for '${options.fontName}'`); }
  return Buffer.from(ttf2eot(Buffer.from(buffer)).buffer);
}

function toWoff(buffer, options) {
  if (options.verbose) { console.log(`Rendering woff format for '${options.fontName}'`); }
  return Buffer.from(ttf2woff(Buffer.from(buffer), { metadata: options.metadata }).buffer);
}

async function toWoff2(buffer, options) {
  if (options.verbose) { console.log(`Rendering woff2 format for '${options.fontName}'`); }

  const woff2Content = await wawoff2.compress(Buffer.from(buffer));

  // TODO: Investigate the reason for indeterministic results of wawoff.comporess() (last byte !== 0)
  woff2Content[woff2Content.length-1] = 0;

  return woff2Content;
}

/**
 * Resolves the individual template-names.
 * @param {null|string|WebfontTemplateOptions|Array<string|WebfontTemplateOptions>} [templates] Templates
 * @returns {null|Array<string|WebfontTemplateOptions>} template-names
 */
function getTemplates( templates ) {
  if (!templates) { return null; }

  if (Array.isArray(templates)) { return templates; }
  else { return [templates]; }
}

/**
 * Resolves the absolute path of the template for type or (relative) template path.
 * @param {string} templateTypeOrPath Template type or (relative) template path.
 *
 * @returns {WebfontTemplateInput} Resolved input information.
 */
function resolveTemplateInput(templateTypeOrPath) {
  const builtInTemplates = {
    css : 'template.css.njk',
    html: 'template.html.njk',
    scss: 'template.scss.njk',
  };

  if (Object.keys(builtInTemplates).includes(templateTypeOrPath)) {
    return {
      builtInType : templateTypeOrPath,
      fileDirPath : path.resolve(__dirname, "../templates"),
      filePath    : path.resolve(__dirname, `../templates/${builtInTemplates[templateTypeOrPath]}`),
    }
  } else {
    const resolvedPath = path.resolve(templateTypeOrPath);

    return {
      builtInType : null,
      fileDirPath : path.dirname(resolvedPath),
      filePath    : resolvedPath,
    };
  }
}

/**
 * Resolves the absolute path of the output file.
 *
 * @param {WebfontTemplateInput}   templateInput   Input information for this template.
 * @param {WebfontTemplateOptions} templateOptions Options specific for this template.
 * @param {Object}                 runOptions      Options specified or resulting defaults for this run.
 *
 * @returns {string} Absolute  path of the output file.
 */
function resolveTemplateOutputPath(templateInput, templateOptions, runOptions) {
  const fontName   = runOptions.fontName;

  let   outDirPath = templateOptions.outDir || runOptions.destTemplate || runOptions.dest;

  return templateInput.builtInType
    ? path.resolve(outDirPath, `${fontName}.${templateInput.builtInType}`)
    : path.resolve(outDirPath, path.basename(templateInput.filePath).replace(/\.njk$/, ''));
}

/**
 * Renders the Template using specified Options
 * @param {WebfontTemplateOptions|string} templateOptions Options specific for this template.
 * @param {Object}                        runOptions      Options specified or resulting defaults for this run.
 * @param {WebfontGlyphsData}             glyphsData      Glyphs resolved by `getGlyphsData()`
 * @param {string}                        [hash]          Hash to be used for _nunjucks'_ `hash`-Option if `runOptions.addHashInFontUrl` is enabled.
 *
 * @returns {WebfontTemplateRenderResult}
 */
function renderTemplate(templateOptions, runOptions, glyphsData, hash) {
  if (typeof templateOptions === 'string') { templateOptions = {file: templateOptions}; }

  if (runOptions.verbose) { console.log(`Preparing template '${templateOptions.file}'`); }

  const templateInput = resolveTemplateInput(templateOptions.file);
  if (runOptions.verbose) { console.log(`Resolved template path to '${templateInput.filePath}'`); }

  const outputPath    = resolveTemplateOutputPath(templateInput, templateOptions, runOptions);
  if (runOptions.verbose) { console.log(`Resolved output path to '${outputPath}'`); }

  nunjucks.configure(templateInput.fileDirPath);

  const nunjucksOptions = deepmerge.all([
    {
      glyphs: glyphsData.map(glyphData => {
        if (typeof runOptions.glyphTransformFn === "function") {
          glyphData.metadata = runOptions.glyphTransformFn(glyphData.metadata);
        }

        return glyphData.metadata;
      })
    },
    runOptions,
    {
      cacheString: runOptions.templateCacheString || Date.now(),
      className  : templateOptions.className || runOptions.templateClassName || runOptions.fontName,
      fontName   : runOptions.templateFontName || runOptions.fontName,
      fontPath   : (templateOptions.fontPath || runOptions.templateFontPath).replace(/\/?$/, "/"),
    },
    runOptions.addHashInFontUrl ? { hash : hash } : {}
  ]);

  if (runOptions.verbose) { console.log(`Rendering template '${templateOptions.file}'`); }
  return {
    input      : templateInput.filePath,
    content    : nunjucks.render(templateInput.filePath, nunjucksOptions),
    destPath   : outputPath,
    builtInType: templateInput.builtInType,
  }
}

export default async function (initialOptions) {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  let options = Object.assign(
    {},
    {
      ascent: void 0,
      centerHorizontally: false,
      descent: 0,
      dest: './',
      destTemplate: void 0,
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
          version: null,
        },
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
      templateCacheString: null,
      verbose: false,
    },
    initialOptions
  );

  const config = await buildConfig({
    configFile: options.configFile,
  });

  if (Object.keys(config).length > 0) {
    // Do not merge Arrays, since this this would leak the defaults into specified config-options.
    // E.g. you can't reduce the defined defaults.
    // Fixes config.formats: ['woff2'] + ["svg", "ttf", "eot", "woff", "woff2"] = ["svg", "ttf", "eot", "woff", "woff2", "woff2"]
    // eslint-disable-next-line require-atomic-updates
    options = deepmerge(options, config.config, { arrayMerge: function dontMergeUseRight(l, r) { return [...r]; }});
    // eslint-disable-next-line require-atomic-updates
    options.filePath = config.filepath;
  }

  // Convert string[] to object-map for easy access.
  const formats = options.formats.reduce((l,r) => {l[r] = options.formatsOptions[r] || {}; return l;}, {});

  if (options.verbose) { console.log(`Collection SVGs for '${options.files}'`); }
  const foundFiles = await globby([].concat(options.files));
  const filteredFiles = foundFiles.filter(
    (foundFile) => path.extname(foundFile) === ".svg"
  );

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  const result     = {};
  const hash       = { all: crypto.createHash(HASH_ALGORITHM) };
  const templates  = getTemplates(options.template);
  const glyphsData = await getGlyphsData(filteredFiles, options);
  const svgContent = await toSvg(glyphsData, options);
  const ttfContent = toTtf(svgContent, options);

  result.glyphsData = glyphsData;
  result.templates  = []; // templates array may never be undefined
  result.fonts      = []; // font array may never be undefined

  if (options.verbose) { console.log(`Rendering fonts for formats'${options.formats.join(', ')}'`); }

  if (formats.svg) {
    hash.all.update(svgContent);
    hash.svg = crypto.createHash(HASH_ALGORITHM).update(svgContent).digest(HASH_DIGEST_ENCODING);

    result.svg = svgContent;
  }

  if (formats.ttf) {
    hash.all.update(ttfContent);
    hash.ttf = crypto.createHash(HASH_ALGORITHM).update(ttfContent).digest(HASH_DIGEST_ENCODING);

    result.ttf = ttfContent;
  }

  if (formats.eot) {
    const eotContent = toEot(ttfContent, options);

    hash.all.update(eotContent);
    hash.eot = crypto.createHash(HASH_ALGORITHM).update(eotContent).digest(HASH_DIGEST_ENCODING);

    result.eot = eotContent;
  }

  if (formats.woff) {
    const woffContent = toWoff(ttfContent, options);

    hash.all.update(woffContent);
    hash.woff = crypto.createHash(HASH_ALGORITHM).update(woffContent).digest(HASH_DIGEST_ENCODING);

    result.woff = woffContent;
  }

  if (formats.woff2) {
    const woff2Content = await toWoff2(ttfContent, options);

    hash.all.update(woff2Content);
    hash.woff2 = crypto.createHash(HASH_ALGORITHM).update(woff2Content).digest(HASH_DIGEST_ENCODING);

    result.woff2 = woff2Content;
  }

  hash.all = hash.all.digest(HASH_DIGEST_ENCODING);
  result.hash = hash.all;

  // For backwards compatibility: Previous versions enforced the output of `${options.fontName}.hash` implicitly,
  // simply by the fact hat the old result object had a property with that name, that was not deleted if no templates were present in the result.
  // This behavior is rather unexpected and may not be desired in future versions.
  // If so, remove the following block.
  if (!Array.isArray(templates) && !formats.hash) {
    formats.hash = {};
    hash.hash    = hash.all;
  }

  Object.entries(formats).forEach(([format, formatOptions]) => {
    result.fonts.push({
      format  : format,
      content : result[format],
      destPath: path.resolve(options.dest, `${options.fontName}.${format}`),
      hash    : hash[format],
    });
  });

  if (Array.isArray(templates)) {
    result.templates = templates.map(templateOptions => renderTemplate(templateOptions, options, result.glyphsData));
    // Make first result accessible as .template for backwards compatibility
    if (result.templates.length > 0) { result.template = result.templates[0].content;}
  }

  // For backwards compatibility: true if any of the results is based on an built-in template.
  result.usedBuildInTemplate = !!result.templates.find(({builtInType}) => !!builtInType);
  result.config = options;

  return result;
}

/**
 * @property {undefined|number}                            ascent
 * @property {boolean}                                     centerHorizontally
 * @property {number}                                      descent
 * @property {string}                                      dest
 * @property {string}                                      destTemplate
 * @property {boolean}                                     fixedWidth
 * @property {number}                                      fontHeight
 * @property {null|string}                                 fontId
 * @property {string}                                      fontName
 * @property {string}                                      fontStyle
 * @property {string}                                      fontWeight
 * @property {string[]}                                    formats
 * @property {WebfontFormatOptions}                        formatsOptions
 * @property {GlyphMetadataCallback}                       glyphTransformFn
 * @property {number}                                      maxConcurrency
 * @property {null|string}                                 metadata
 * @property {null|SvgIcons2SvgFontMetadataService}        metadataProvider
 * @property {boolean}                                     normalize
 * @property {boolean}                                     prependUnicode
 * @property {number}                                      round
 * @property {boolean}                                     sort
 * @property {number}                                      startUnicode
 * @property {null|string|string[]|WebfontTemplateOptions} template
 * @property {null|string}                                 templateClassName
 * @property {null|string}                                 templateFontName
 * @property {string}                                      templateFontPath
 * @property {null|string}                                 templateCacheString
 * @property {boolean}                                     verbose
 */

/**
 * @typedef {Object} WebfontFormatOptions
 * @property {Svg2TtfOptions} ttf
 */

/**
 * @typedef {Object} Svg2TtfOptions
 * @property {string} [copyright]   Copyright string
 * @property {string} [description] Description string
 * @property {number} [ts]          Unix timestamp (in seconds) to override creation time
 * @property {string} [url]         Manufacturer url (optional)
 * @property {string} [version]     Font version string, can be Version x.y or x.y.
 */

/**
 * @typedef {Object} WebfontTemplateOptions
 * @property {string} file         Type or (relative) template path
 * @property {string} [outDir]     The (relative) path of the output file.
 * @property {string} [className]  Classname used for each font-icon class.
 * @property {string} [fontPath]   Path used as URI in the resulting template.
 */

/**
 * @typedef {Object} WebfontTemplateInput
 * @property {string}      filePath    Absolute path to the file.
 * @property {string}      fileDirPath Absolute path to the directory the file is located in.
 * @property {string|null} builtInType Type of the template, if it is an built-in template.
 */

/**
 * @typedef {Object} WebfontGlyphsData
 * @property {string}                contents
 * @property {FormatInputPathObject} srcPath
 * @property {WebfontGlyphsMetadata} metadata
 */

/**
 * @typedef {Object} WebfontGlyphsMetadata
 * @property {string}   path
 * @property {string}   name
 * @property {string[]} unicode
 * @property {boolean}  renamed
 */

/**
 * @callback GlyphMetadataCallback
 * @param {WebfontGlyphsMetadata}
 * @returns {WebfontGlyphsMetadata}
 */

/**
 * @typedef {Object} WebfontTemplateRenderResult
 * @property {string}  input       Template type or (relative) template path, this result is based on.
 * @property {string}  content     The rendered template result.
 * @property {string}  destPath    The file path the output should be written to.
 * @property {boolean} builtInType Type of the template, if it is based on an built-in template.
 */

/**
 * @typedef {Object} WebfontFontRenderResult
 * @property {string}                        format   Type of the font format, this result is based on.
 * @property {string|ArrayBuffer|Uint8Array} content  The rendered font result.
 * @property {string}                        destPath The file path the output should be written to.
 * @property {string}                        hash     Hash of the resulting content.
 */

/**
 * @callback SvgIcons2SvgFontMetadataService
 * @param {string}                                                 file
 * @param {function(error:Error, metadata: WebfontGlyphsMetadata)} callback
 */
