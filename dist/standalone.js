"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (initialOptions) {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  let options = Object.assign({}, {
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
    maxConcurrency: _os2.default.cpus().length,
    metadata: null,
    metadataProvider: null,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    startUnicode: 0xea01,
    template: null,
    templateClassName: null,
    templateFontName: null,
    templateFontPath: "./",
    verbose: false
  }, initialOptions);

  let glyphsData = [];

  return buildConfig({
    configFile: options.configFile
  }).then(loadedConfig => {
    if (Object.keys(loadedConfig).length > 0) {
      options = (0, _mergeDeep2.default)({}, options, loadedConfig.config);
      options.filePath = loadedConfig.filepath;
    }

    return (0, _globby2.default)([].concat(options.files)).then(foundFiles => {
      const filteredFiles = foundFiles.filter(foundFile => _path2.default.extname(foundFile) === ".svg");

      if (filteredFiles.length === 0) {
        throw new Error("Files glob patterns specified did not match any files");
      }

      return getGlyphsData(foundFiles, options);
    }).then(returnedGlyphsData => {
      glyphsData = returnedGlyphsData;

      return svgIcons2svgFont(returnedGlyphsData, options);
    })
    // Maybe add ttfautohint
    .then(svgFont => {
      const result = {};

      result.svg = svgFont;
      result.glyphsData = glyphsData;

      result.ttf = Buffer.from((0, _svg2ttf2.default)(result.svg.toString(), options.formatsOptions && options.formatsOptions.ttf ? options.formatsOptions.ttf : {}).buffer);

      if (options.formats.indexOf("eot") !== -1) {
        result.eot = Buffer.from((0, _ttf2eot2.default)(result.ttf).buffer);
      }

      if (options.formats.indexOf("woff") !== -1) {
        result.woff = Buffer.from((0, _ttf2woff2.default)(result.ttf, {
          metadata: options.metadata
        }).buffer);
      }

      if (options.formats.indexOf("woff2") !== -1) {
        result.woff2 = (0, _ttf2woff4.default)(result.ttf);
      }

      return result;
    }).then(result => {
      if (!options.template) {
        return result;
      }

      const buildInTemplateDirectory = _path2.default.join(__dirname, "../templates");
      const buildInTemplates = {
        css: {
          path: _path2.default.join(buildInTemplateDirectory, "template.css.njk")
        },
        html: {
          path: _path2.default.join(buildInTemplateDirectory, "template.preview-html.njk")
        },
        scss: {
          path: _path2.default.join(buildInTemplateDirectory, "template.scss.njk")
        }
      };

      let templateFilePath = null;

      if (Object.keys(buildInTemplates).includes(options.template)) {
        result.usedBuildInTemplate = true;

        _nunjucks2.default.configure(_path2.default.join(__dirname, "../"));

        templateFilePath = `${buildInTemplateDirectory}/template.${options.template}.njk`;
      } else {
        const resolvedTemplateFilePath = _path2.default.resolve(options.template);

        _nunjucks2.default.configure(_path2.default.dirname(resolvedTemplateFilePath));

        templateFilePath = _path2.default.resolve(resolvedTemplateFilePath);
      }

      const nunjucksOptions = (0, _mergeDeep2.default)({}, {
        glyphs: glyphsData.map(glyphData => {
          if (typeof options.glyphTransformFn === "function") {
            glyphData.metadata = options.glyphTransformFn(glyphData.metadata);
          }

          return glyphData.metadata;
        })
      }, options, {
        className: options.templateClassName ? options.templateClassName : options.fontName,
        fontName: options.templateFontName ? options.templateFontName : options.fontName,
        fontPath: options.templateFontPath.replace(/\/?$/, "/")
      });

      result.template = _nunjucks2.default.render(templateFilePath, nunjucksOptions);

      return result;
    }).then(result => {
      if (options.formats.indexOf("svg") === -1) {
        delete result.svg;
      }

      if (options.formats.indexOf("ttf") === -1) {
        delete result.ttf;
      }

      result.config = options;

      return result;
    });
  });
};

var _stream = require("stream");

var _svgicons2svgfont = require("svgicons2svgfont");

var _svgicons2svgfont2 = _interopRequireDefault(_svgicons2svgfont);

var _cosmiconfig = require("cosmiconfig");

var _cosmiconfig2 = _interopRequireDefault(_cosmiconfig);

var _asyncThrottle = require("async-throttle");

var _asyncThrottle2 = _interopRequireDefault(_asyncThrottle);

var _metadata = require("svgicons2svgfont/src/metadata");

var _metadata2 = _interopRequireDefault(_metadata);

var _filesorter = require("svgicons2svgfont/src/filesorter");

var _filesorter2 = _interopRequireDefault(_filesorter);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _globby = require("globby");

var _globby2 = _interopRequireDefault(_globby);

var _mergeDeep = require("merge-deep");

var _mergeDeep2 = _interopRequireDefault(_mergeDeep);

var _nunjucks = require("nunjucks");

var _nunjucks2 = _interopRequireDefault(_nunjucks);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _svg2ttf = require("svg2ttf");

var _svg2ttf2 = _interopRequireDefault(_svg2ttf);

var _ttf2eot = require("ttf2eot");

var _ttf2eot2 = _interopRequireDefault(_ttf2eot);

var _ttf2woff = require("ttf2woff");

var _ttf2woff2 = _interopRequireDefault(_ttf2woff);

var _ttf2woff3 = require("ttf2woff2");

var _ttf2woff4 = _interopRequireDefault(_ttf2woff3);

var _xml2js = require("xml2js");

var _xml2js2 = _interopRequireDefault(_xml2js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getGlyphsData(files, options) {
  const metadataProvider = options.metadataProvider || (0, _metadata2.default)({
    prependUnicode: options.prependUnicode,
    startUnicode: options.startUnicode
  });

  const xmlParser = new _xml2js2.default.Parser();
  const throttle = (0, _asyncThrottle2.default)(options.maxConcurrency);

  return Promise.all(files.map(srcPath => throttle(() => new Promise((resolve, reject) => {
    const glyph = _fs2.default.createReadStream(srcPath);
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
    const sortedGlyphsData = glyphsData.sort((fileA, fileB) => (0, _filesorter2.default)(fileA.srcPath, fileB.srcPath));

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

function svgIcons2svgFont(glyphsData, options) {
  let result = "";

  return new Promise((resolve, reject) => {
    const fontStream = new _svgicons2svgfont2.default({
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
    configPath = _path2.default.resolve(process.cwd(), options.configFile);
  }

  return (0, _cosmiconfig2.default)("webfont", cosmiconfigOptions).load(searchPath, configPath).then(result => {
    if (!result) {
      return {};
    }

    return result;
  });
}