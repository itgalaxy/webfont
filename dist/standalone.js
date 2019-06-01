"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _stream = require("stream");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _svgicons2svgfont = _interopRequireDefault(require("svgicons2svgfont"));

var _cosmiconfig = _interopRequireDefault(require("cosmiconfig"));

var _pLimit = _interopRequireDefault(require("p-limit"));

var _ttfinfo = _interopRequireDefault(require("ttfinfo"));

var _metadata = _interopRequireDefault(require("svgicons2svgfont/src/metadata"));

var _filesorter = _interopRequireDefault(require("svgicons2svgfont/src/filesorter"));

var _globby = _interopRequireDefault(require("globby"));

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _nunjucks = _interopRequireDefault(require("nunjucks"));

var _svg2ttf = _interopRequireDefault(require("svg2ttf"));

var _ttf2eot = _interopRequireDefault(require("ttf2eot"));

var _ttf2woff = _interopRequireDefault(require("ttf2woff"));

var _wawoff = _interopRequireDefault(require("wawoff2"));

var _xml2js = _interopRequireDefault(require("xml2js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function buildConfig(options) {
  let searchPath = process.cwd();
  let configPath = null;

  if (options.configFile) {
    searchPath = null;
    configPath = _path.default.resolve(process.cwd(), options.configFile);
  }

  const configExplorer = (0, _cosmiconfig.default)("webfont");
  const config = await (configPath ? configExplorer.load(configPath) : configExplorer.search(searchPath));

  if (!config) {
    return {};
  }

  return config;
}

function getGlyphsData(files, options) {
  const metadataProvider = options.svgMetadataProvider || (0, _metadata.default)({
    prependUnicode: options.prependUnicode,
    startUnicode: options.startUnicode
  });
  const xmlParser = new _xml2js.default.Parser();
  const throttle = (0, _pLimit.default)(options.maxConcurrency);
  return Promise.all(files.map(srcPath => throttle(() => new Promise((resolve, reject) => {
    const glyph = _fs.default.createReadStream(srcPath);

    let glyphContents = "";
    return glyph.on("error", glyphError => reject(glyphError)).on("data", data => {
      glyphContents += data.toString();
    }).on("end", () => {
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
  })))).then(glyphsData => {
    const sortedGlyphsData = options.sort ? glyphsData.sort((fileA, fileB) => (0, _filesorter.default)(fileA.srcPath, fileB.srcPath)) : glyphsData;
    return Promise.all(sortedGlyphsData.map(glyphData => new Promise((resolve, reject) => {
      metadataProvider(glyphData.srcPath, (error, metadata) => {
        if (error) {
          return reject(error);
        }

        glyphData.metadata = metadata;
        return resolve(glyphData);
      });
    })));
  });
}

function getFontsData(files, options) {
  const metadataProvider = options.ttfMetadataProvider || _ttfinfo.default;
  const throttle = (0, _pLimit.default)(options.maxConcurrency);
  return Promise.all(files.map(srcPath => throttle(() => new Promise((resolve, reject) => {
    const font = _fs.default.createReadStream(srcPath);

    let chunks = [];
    return font.on("error", glyphError => reject(glyphError)).on("data", data => {
      chunks.push(data);
    }).on("end", () => {
      if (chunks.length === 0) {
        return reject(new Error(`Empty file ${srcPath}`));
      }

      const fontData = {
        srcPath,
        contents: Buffer.concat(chunks)
      };
      return resolve(fontData);
    });
  })))).then(fontsData => {
    const sortedFontsData = options.sort ? fontsData.sort((fileA, fileB) => (0, _filesorter.default)(fileA.srcPath, fileB.srcPath)) : fontsData;
    return Promise.all(sortedFontsData.map(fontData => new Promise((resolve, reject) => {
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
          fileName: _path.default.basename(fontData.srcPath, '.ttf')
        };
        return resolve(fontData);
      });
    })));
  });
}

function toSvg(glyphsData, options) {
  let result = "";
  return new Promise((resolve, reject) => {
    const fontStream = new _svgicons2svgfont.default({
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
    }).on("finish", () => resolve(result)).on("data", data => {
      result += data;
    }).on("error", error => reject(error));
    glyphsData.forEach(glyphData => {
      const glyphStream = new _stream.Readable();
      glyphStream.push(glyphData.contents);
      glyphStream.push(null);
      glyphStream.metadata = glyphData.metadata;
      fontStream.write(glyphStream);
    });
    fontStream.end();
  });
}

function toTtf(buffer, options) {
  return Buffer.from((0, _svg2ttf.default)(buffer, options).buffer);
}

function toEot(buffer) {
  return Buffer.from((0, _ttf2eot.default)(buffer).buffer);
}

function toWoff(buffer, options) {
  return Buffer.from((0, _ttf2woff.default)(buffer, options).buffer);
}

function toWoff2(buffer) {
  return _wawoff.default.compress(buffer);
}

async function _default(initialOptions) {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  let options = Object.assign({}, {
    ascent: undefined,
    // eslint-disable-line no-undefined
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
  }, initialOptions);
  const config = await buildConfig({
    configFile: options.configFile
  });

  if (Object.keys(config).length > 0) {
    options = (0, _deepmerge.default)(options, config.config);
    options.filePath = config.filepath;
  }

  const foundFiles = await (0, _globby.default)([].concat(options.files));
  const filteredFiles = foundFiles.filter(foundFile => _path.default.extname(foundFile) === (options.ttfMode ? ".ttf" : ".svg"));

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  const result = {};

  if (!options.ttfMode) {
    result.glyphsData = await getGlyphsData(filteredFiles, options);
    result.svg = await toSvg(result.glyphsData, options);
    result.ttf = toTtf(result.svg, options.formatsOptions && options.formatsOptions.ttf ? options.formatsOptions.ttf : {});

    if (options.formats.includes("eot")) {
      result.eot = toEot(result.ttf);
    }

    if (options.formats.includes("woff")) {
      result.woff = toWoff(result.ttf, {
        metadata: options.metadata
      });
    }

    if (options.formats.includes("woff2")) {
      result.woff2 = await toWoff2(result.ttf);
    }
  } else {
    result.fontsData = await getFontsData(filteredFiles, options);
    result.ttf = result.fontsData.map(fontData => ({
      name: fontData.srcPath,
      buffer: fontData.contents
    }));

    if (options.formats.includes("eot")) {
      result.eot = result.ttf.map(file => ({
        name: file.name.replace(/\.ttf$/, '.eot'),
        buffer: toEot(file.buffer)
      }));
    }

    if (options.formats.includes("woff")) {
      result.woff = result.ttf.map(file => ({
        name: file.name.replace(/\.ttf$/, '.woff'),
        buffer: toWoff(file.buffer, {
          metadata: options.metadata
        })
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
        buffer: await toWoff2(file.buffer)
      }))); // console.timeEnd('WOFF2');
      // console.log('End WOFF2');
    }
  }

  if (options.template) {
    const templateFileName = !options.ttfMode ? "icons" : "fonts";

    const templateDirectory = _path.default.resolve(__dirname, "../templates");

    const buildInTemplates = {
      css: {
        path: _path.default.join(templateDirectory, `${templateFileName}.css.njk`)
      },
      html: {
        path: _path.default.join(templateDirectory, `${templateFileName}.html.njk`)
      },
      scss: {
        path: _path.default.join(templateDirectory, `${templateFileName}.scss.njk`)
      }
    };
    let templateFilePath = null;

    if (Object.keys(buildInTemplates).includes(options.template)) {
      result.usedBuildInTemplate = true;

      _nunjucks.default.configure(_path.default.resolve(__dirname, "../"));

      templateFilePath = `${templateDirectory}/${templateFileName}.${options.template}.njk`;
    } else {
      const resolvedTemplateFilePath = _path.default.resolve(options.template);

      _nunjucks.default.configure(_path.default.dirname(resolvedTemplateFilePath));

      templateFilePath = _path.default.resolve(resolvedTemplateFilePath);
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

    const nunjucksOptions = _deepmerge.default.all([metadata, options, {
      className: options.templateClassName || options.fontName,
      fontName: options.templateFontName || options.fontName,
      fontPath: options.templateFontPath.replace(/\/?$/, "/")
    }]);

    result.template = _nunjucks.default.render(templateFilePath, nunjucksOptions);
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