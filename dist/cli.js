#!/usr/bin/env node
"use strict";

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _meow = _interopRequireDefault(require("meow"));

var _resolveFrom = _interopRequireDefault(require("resolve-from"));

var _standalone = _interopRequireDefault(require("./standalone"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cli = (0, _meow.default)(`
    Usage: webfont [input] [options]

    Input: File(s) or glob(s).

        If an input argument is wrapped in quotation marks, it will be passed to "fast-glob"
        for cross-platform glob support.

    Options:

        --config

            Path to a specific configuration file (JSON, YAML, or CommonJS)
            or the name of a module in \`node_modules\` that points to one.
            If no \`--config\` argument is provided, webfont will search for
            configuration  files in the following places, in this order:
               - a \`webfont\` property in \`package.json\`
               - a \`.webfontrc\` file (with or without filename extension:
                   \`.json\`, \`.yaml\`, and \`.js\` are available)
               - a \`webfont.config.js\` file exporting a JS object
            The search will begin in the working directory and move up the
            directory tree until a configuration file is found.

        -f, --font-name

            The font family name you want, default: "webfont".

        -h, --help

            Output usage information.

        -v, --version

            Output the version number.

        -r, --formats

            Only this formats generate.

        -d, --dest

            Destination for generated fonts.

        -t, --template

            Type of template ('css', 'scss') or path to custom template.

        -s, --dest-template

            Destination for generated template. If not passed used \`dest\` argument value.

        -c, --template-class-name

            Class name in css template.

        -p, --template-font-path

            Font path in css template.

        -n, --template-font-name

            Font name in css template.

        --no-sort

            Keeps the files in the same order of entry

        --verbose

            Tell me everything!.

    For "svgicons2svgfont":

        --font-id

            The font id you want, default as "--font-name".

        --font-style

            The font style you want.

        --font-weight

            The font weight you want.

        --fixed-width

            Creates a monospace font of the width of the largest input icon.

        --center-horizontally

            Calculate the bounds of a glyph and center it horizontally.

        --normalize

            Normalize icons by scaling them to the height of the highest icon.

        --font-height

            The outputted font height [MAX(icons.height)].

        --round

            Setup the SVG path rounding [10e12].

        --descent

            The font descent [0].

        --ascent

            The font ascent [height - descent].

        --start-unicode

            The start unicode codepoint for unprefixed files [0xEA01].

        --prepend-unicode

            Prefix files with their automatically allocated unicode codepoint.

        --metadata

            Content of the metadata tag.
`, {
  autoHelp: false,
  autoVersion: false,
  flags: {
    ascent: {
      type: "string"
    },
    "center-horizontally": {
      type: "boolean"
    },
    config: {
      default: null
    },
    descent: {
      type: "string"
    },
    dest: {
      alias: "d",
      default: process.cwd(),
      type: "string"
    },
    "dest-template": {
      alias: "s",
      type: "string"
    },
    "fixed-width": {
      type: "boolean"
    },
    "font-height": {
      type: "string"
    },
    "font-id": {
      type: "string"
    },
    "font-name": {
      alias: "u",
      type: "string"
    },
    "font-style": {
      type: "string"
    },
    "font-weight": {
      type: "string"
    },
    formats: {
      alias: "f"
    },
    help: {
      alias: "h",
      type: "boolean"
    },
    normalize: {
      type: "boolean"
    },
    "prepend-unicode": {
      type: "boolean"
    },
    round: {
      type: "string"
    },
    sort: {
      default: true,
      type: "boolean"
    },
    "start-unicode": {
      type: "string"
    },
    template: {
      alias: "t",
      type: "string"
    },
    "template-class-name": {
      alias: "c",
      type: "string"
    },
    "template-font-name": {
      alias: "n",
      type: "string"
    },
    "template-font-path": {
      alias: "p",
      type: "string"
    },
    verbose: {
      default: false,
      type: "boolean"
    },
    version: {
      alias: "v",
      type: "boolean"
    }
  }
});
const optionsBase = {};

if (cli.flags.config) {
  // Should check these possibilities:
  //   a. name of a node_module
  //   b. absolute path
  //   c. relative path relative to `process.cwd()`.
  // If none of the above work, we'll try a relative path starting
  // in `process.cwd()`.
  optionsBase.configFile = (0, _resolveFrom.default)(process.cwd(), cli.flags.config) || _path.default.join(process.cwd(), cli.flags.config);
}

if (cli.flags.fontName) {
  optionsBase.fontName = cli.flags.fontName;
}

if (cli.flags.formats) {
  optionsBase.formats = cli.flags.formats;
}

if (cli.flags.dest) {
  optionsBase.dest = cli.flags.dest;
}

if (cli.flags.template) {
  optionsBase.template = cli.flags.template;
}

if (cli.flags.templateClassName) {
  optionsBase.templateClassName = cli.flags.templateClassName;
}

if (cli.flags.templateFontPath) {
  optionsBase.templateFontPath = cli.flags.templateFontPath;
}

if (cli.flags.templateFontName) {
  optionsBase.templateFontName = cli.flags.templateFontName;
}

if (cli.flags.destTemplate) {
  optionsBase.destTemplate = cli.flags.destTemplate;
}

if (cli.flags.verbose) {
  optionsBase.verbose = cli.flags.verbose;
}

if (cli.flags.fontId) {
  optionsBase.fontId = cli.flags.fontId;
}

if (cli.flags.fontStyle) {
  optionsBase.fontStyle = cli.flags.fontStyle;
}

if (cli.flags.fontWeight) {
  optionsBase.fontWeight = cli.flags.fontWeight;
}

if (cli.flags.fixedWidth) {
  optionsBase.fixedWidth = cli.flags.fixedWidth;
}

if (cli.flags.centerHorizontally) {
  optionsBase.centerHorizontally = cli.flags.centerHorizontally;
}

if (cli.flags.normalize) {
  optionsBase.normalize = cli.flags.normalize;
}

if (cli.flags.fontHeight) {
  optionsBase.fontHeight = cli.flags.fontHeight;
}

if (cli.flags.round) {
  optionsBase.round = cli.flags.round;
}

if (cli.flags.descent) {
  optionsBase.descent = cli.flags.descent;
}

if (cli.flags.ascent) {
  optionsBase.ascent = cli.flags.ascent;
}

if (cli.flags.startUnicode) {
  optionsBase.startUnicode = cli.flags.startUnicode;
}

if (cli.flags.prependUnicode) {
  optionsBase.prependUnicode = cli.flags.prependUnicode;
}

if (cli.flags.metadata) {
  optionsBase.metadata = cli.flags.metadata;
}

if (cli.flags.sort === false) {
  optionsBase.sort = cli.flags.sort;
}

if (cli.flags.help || cli.flags.h) {
  cli.showHelp();
}

if (cli.flags.version || cli.flags.v) {
  cli.showVersion();
}

Promise.resolve().then(() => {
  const options = Object.assign({}, optionsBase, {
    files: cli.input
  });

  if (options.files.length === 0) {
    cli.showHelp();
  }

  return (0, _standalone.default)(options).then(result => {
    result.config = Object.assign({}, {
      dest: options.dest,
      destTemplate: options.destTemplate
    }, result.config);
    return result;
  });
}).then(result => {
  const {
    fontName,
    dest
  } = result.config;
  let destTemplate = null;

  if (result.template) {
    ({
      destTemplate
    } = result.config);

    if (!destTemplate) {
      destTemplate = dest;
    }

    if (result.usedBuildInTemplate) {
      destTemplate = _path.default.join(destTemplate, `${result.config.fontName}.${result.config.template}`);
    } else {
      destTemplate = _path.default.join(destTemplate, _path.default.basename(result.config.template).replace(".njk", ""));
    }
  }

  return Promise.resolve().then(() => Promise.all(Object.keys(result).map(type => {
    if (type === "config" || type === "usedBuildInTemplate" || type === "glyphsData") {
      return null;
    }

    const content = result[type];
    let file = null;

    if (type !== "template") {
      file = _path.default.resolve(_path.default.join(dest, `${fontName}.${type}`));
    } else {
      file = _path.default.resolve(destTemplate);
    }

    return _fsExtra.default.writeFile(file, content);
  }))).then(() => Promise.resolve(result));
}).catch(error => {
  // eslint-disable-next-line no-console
  console.log(error.stack);
  const exitCode = typeof error.code === "number" ? error.code : 1;
  process.exit(exitCode);
});