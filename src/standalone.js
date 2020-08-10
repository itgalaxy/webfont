import { Readable } from "stream";
import fs from "fs";
import path from "path";
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

const OPTIONS_TEMPLATE_SEPARATOR = ',';

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
  if (options.verbose) { console.log(`Rendering glyphs for '${options.fontName}'`); }

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
  const renderMsgHint = options.formats.includes('ttf') ? '' : ' (internal base for further rendering)';
  if (options.verbose) { console.log(`Rendering ttf format for '${options.fontName}'${renderMsgHint}`); }

  return Buffer.from(
    svg2ttf(
      buffer,
      options.formatsOptions && options.formatsOptions.ttf
        ? options.formatsOptions.ttf
        : {})
    .buffer);
}

function toEot(buffer, options) {
  if (options.verbose) { console.log(`Rendering eof format for '${options.fontName}'`); }
  return Buffer.from(ttf2eot(buffer).buffer);
}

function toWoff(buffer, options) {
  if (options.verbose) { console.log(`Rendering woff format for '${options.fontName}'`); }
  return Buffer.from(ttf2woff(buffer, { metadata: options.metadata }).buffer);
}

function toWoff2(buffer, options) {
  if (options.verbose) { console.log(`Rendering woff2 format for '${options.fontName}'`); }
  return wawoff2.compress(buffer);
}

/**
 * Resolves the absolute path of the template for type or (relative) template path.
 * @param {String} templateTypeOrPath Template type or (relative) template path.
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
 * @returns {String} Absolute  path of the output file.
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
 * @param {WebfontTemplateOptions|String} templateOptions Options specific for this template.
 * @param {Object}                        runOptions      Options specified or resulting defaults for this run.
 * @param {Object}                        glyphsData      Glyphs resolved by `getGlyphsData()`
 *
 * @returns {WebfontTemplateRenderResult}
 */
function renderTemplate(templateOptions, runOptions, glyphsData) {
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
      className: templateOptions.className || runOptions.templateClassName || runOptions.fontName,
      fontName : runOptions.templateFontName || runOptions.fontName,
      fontPath : (templateOptions.fontPath || runOptions.templateFontPath).replace(/\/?$/, "/"),
    }
  ]);

  if (runOptions.verbose) { console.log(`Rendering template '${templateOptions.file}'`); }
  return {
    input      : templateInput.filePath,
    content    : nunjucks.render(templateInput.filePath, nunjucksOptions),
    destPath   : outputPath,
    builtInType: templateInput.builtInType,
  }
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
      dest: './',
      destTemplate: './',
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
    // Do not merge Arrays, since this this would leak the defaults into specified config-options.
    // E.g. you can't reduce the defined defaults.
    // Fixes config.formats: ['woff2'] + ["svg", "ttf", "eot", "woff", "woff2"] = ["svg", "ttf", "eot", "woff", "woff2", "woff2"]
    options = deepmerge(options, config.config, { arrayMerge: function dontMergeUseRight(l, r) { return [...r]; }});
    options.filePath = config.filepath;
  }

  // Convert formats[] to object-map for easy access.
  const formats = options.formats.reduce((l,r) => {l[r] = options.formatsOptions[r] || {}; return l;}, {});

  if (options.verbose) { console.log(`Collection SVGs for '${options.files}'`); }
  const foundFiles = await globby([].concat(options.files));
  const filteredFiles = foundFiles.filter(
    foundFile => path.extname(foundFile) === ".svg"
  );

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  const result     = {};
  const glyphsData = await getGlyphsData(filteredFiles, options);
  const svgContent = await toSvg(glyphsData, options);
  const ttfContent = toTtf(svgContent, options);

  result.glyphsData = glyphsData;
  result.templates  = []; // templates array may never be undefined
  result.fonts      = []; // font array may never be undefined

  if (options.verbose) { console.log(`Rendering fonts for formats'${options.formats.join(', ')}'`); }

  if (formats.svg) { result.svg = svgContent; }
  if (formats.ttf) { result.ttf = ttfContent; }
  if (formats.eot) { result.eot = toEot(ttfContent, options); }
  if (formats.woff) { result.woff = toWoff(ttfContent, options); }
  if (formats.woff2) { result.woff2 = await toWoff2(ttfContent, options); }

  Object.entries(formats).forEach(([format, formatOptions]) => {
    result.fonts.push({
      format  : format,
      content : result[format],
      destPath: path.resolve(options.dest, `${options.fontName}.${format}`),
    });
  });

  if (options.template) {
    let templates = options.template;
    if (typeof templates !== 'string' && !Array.isArray(templates)) {
      throw new TypeError('template option must be an string or array.');
    }

    if (typeof templates === 'string') {
      if (templates.includes(OPTIONS_TEMPLATE_SEPARATOR)) {
        // Multiple templates, delimiter separated, like: 'css, html'
        templates = templates.split(OPTIONS_TEMPLATE_SEPARATOR).map(template => template.trim());
      } else {
        // Single template
        templates = [templates];
      }
    }

    if (Array.isArray(templates)) {
      result.templates = templates.map(templateOptions => renderTemplate(templateOptions, options, result.glyphsData));
      // Make first result accessible as .template for backwards compatibility
      if (result.templates.length > 0) { result.template = result.templates[0].content;}
    }
  }

  // For backwards compatibility: true if any of the results is based on an built-in template.
  result.usedBuildInTemplate = !!result.templates.find(({builtInType}) => !!builtInType);
  result.config = options;

  return result;
}

/**
 * @typedef {Object} WebfontTemplateOptions
 * @property {String} [file]       Type or (relative) template path
 * @property {String} [outDir]  The (relative) path of the output file.
 * @property {String} [className]  Classname used for each font-icon class.
 * @property {String} [fontPath]   Path used as URI in the resulting template.
 */

/**
 * @typedef {Object} WebfontTemplateInput
 * @property {String}      filePath    Absolute path to the file.
 * @property {String}      fileDirPath Absolute path to the directory the file is located in.
 * @property {String|null} builtInType Type of the template, if it is an built-in template.
 */

/**
 * @typedef {Object} WebfontTemplateRenderResult
 * @property {String}  input       Template type or (relative) template path, this result is based on.
 * @property {String}  content     The rendered template result.
 * @property {String}  destPath    The file path the output should be written to.
 * @property {boolean} builtInType Type of the template, if it is based on an built-in template.
 */

/**
 * @typedef {Object} WebfontFontRenderResult
 * @property {String}  format   Type of the font format, this result is based on.
 * @property {String}  content  The rendered font result.
 * @property {String}  destPath The file path the output should be written to.
 */
