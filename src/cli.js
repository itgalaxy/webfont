#!/usr/bin/env node

import path from "path";
import fs from "fs";
import meow from "meow";
import resolveFrom from "resolve-from";
import standalone from "./standalone";

import {FORMATS, TEMPLATES} from "./standalone"

const cli = meow(
  `
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

            Limit output-formats to the specified types (${FORMATS.join(', ')}).
            --formats ${FORMATS[0]}
            --formats "${FORMATS[0]} ${FORMATS[FORMATS.length-1]}"

        -d, --dest

            Destination for generated fonts.

        -t, --template

            Type of template (${TEMPLATES.join(', ')}) or path to custom template.
            Whitespace-separated built-in template types "css html" to process multiple templates.
            Path containing whitespaces require an separate use of this flag for each path.
            --template ${TEMPLATES[0]}
            --template "${TEMPLATES[0]} ${TEMPLATES[1]}"
            -t "/templates/template name with whitespaces.${TEMPLATES[0]}.njk" -t "/templates/another template.${TEMPLATES[1]}.njk"

        -s, --dest-template

            Destination for generated template. If not passed used \`dest\` argument value.

        -c, --template-class-name

            Class name in css template.

        -p, --template-font-path

            Font path in css template.

        -n, --template-font-name

            Font name in css template.

        --template-cache-string

            Specify cache string in scss/css template.

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

            The start unicode codepoint for files without prefix [0xEA01].

        --prepend-unicode

            Prefix files with their automatically allocated unicode codepoint.

        --metadata

            Content of the metadata tag.

        --add-hash-in-font-url

            Generated font url will be : [webfont].[ext]?v=[hash]
`,
  {
    autoHelp: false,
    autoVersion: false,
    flags: {
      ascent: {
        type: "string",
      },
      "center-horizontally": {
        type: "boolean",
      },
      config: {
        default: null,
      },
      descent: {
        type: "string",
      },
      dest: {
        alias: "d",
        default: process.cwd(),
        type: "string",
      },
      "dest-template": {
        alias: "s",
        type: "string",
      },
      "fixed-width": {
        type: "boolean",
      },
      "font-height": {
        type: "string",
      },
      "font-id": {
        type: "string",
      },
      "font-name": {
        alias: "u",
        type: "string",
      },
      "font-style": {
        type: "string",
      },
      "font-weight": {
        type: "string",
      },
      formats: {
        alias: "f",
      },
      help: {
        alias: "h",
        type: "boolean",
      },
      normalize: {
        type: "boolean",
      },
      "prepend-unicode": {
        type: "boolean",
      },
      round: {
        type: "string",
      },
      sort: {
        default: true,
        type: "boolean",
      },
      "start-unicode": {
        type: "string",
      },
      template: {
        alias: "t",
        type: "string",
        isMultiple: true,
      },
      "template-class-name": {
        alias: "c",
        type: "string",
      },
      "template-font-name": {
        alias: "n",
        type: "string",
      },
      "template-font-path": {
        alias: "p",
        type: "string",
      },
      "add-hash-in-font-url": {
        default: false,
        type: "boolean",
      },
      "template-cache-string": {
        default: "",
        type: "string",
      },
      verbose: {
        default: false,
        type: "boolean",
      },
      version: {
        alias: "v",
        type: "boolean",
      },
    },
  }
);

const optionsBase = {};

if (cli.flags.config) {
  // Should check these possibilities:
  //   a. name of a node_module
  //   b. absolute path
  //   c. relative path relative to `process.cwd()`.
  // If none of the above work, we'll try a relative path starting
  // in `process.cwd()`.
  optionsBase.configFile =
    resolveFrom(process.cwd(), cli.flags.config) ||
    path.join(process.cwd(), cli.flags.config);
}

if (cli.flags.fontName) {
  optionsBase.fontName = cli.flags.fontName;
}

if (cli.flags.formats) {
  optionsBase.formats = parseMultipleValues('formats', /** @type {string} */ cli.flags.formats, FORMATS);
}

if (cli.flags.dest) {
  optionsBase.dest = cli.flags.dest;
}

if (cli.flags.template) {
  optionsBase.template = parseMultipleValues('template', /** @type {string} */ cli.flags.template, TEMPLATES);
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

if (cli.flags.templateCacheString) {
  optionsBase.templateCacheString = cli.flags.templateCacheString;
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

if (cli.flags.addHashInFontUrl) {
  optionsBase.addHashInFontUrl = cli.flags.addHashInFontUrl;
}

if (cli.flags.help || cli.flags.h) {
  cli.showHelp();
}

if (cli.flags.version || cli.flags.v) {
  cli.showVersion();
}

Promise.resolve()
  .then(() => {
    const options = Object.assign({}, optionsBase, {
      files: cli.input,
    });

    if (options.files.length === 0) {
      cli.showHelp();
    }

    return standalone(options);
  })
  .then(result => {
    const options = result.config;

    return Promise.resolve()
      .then(() =>
        Promise.all(
          result.fonts.map(
            renderResult => {
              if (options.verbose) { process.stdout.write(`Writing font-file '${renderResult.format}' -> '${renderResult.destPath}' (${renderResult.content.length})\n`); }

              fs.mkdir(path.dirname(renderResult.destPath), { recursive: true }, (err) => {});
              return fs.writeFile(renderResult.destPath, renderResult.content, (err) => {});
          })
            .concat(result.templates.map(
              renderResult => {
                if (options.verbose) { process.stdout.write(`Writing template-file '${renderResult.input}' -> '${renderResult.destPath}' (${renderResult.content.length})\n`); }

                fs.mkdir(path.dirname(renderResult.destPath), { recursive: true }, (err) => {});
                return fs.writeFile(renderResult.destPath, renderResult.content, (err) => {});
              }))
        )
      )
      .then(() => Promise.resolve(result));
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.log(error.stack);

    const exitCode = typeof error.code === "number" ? error.code : 1;

    process.exit(exitCode);
  });

/**
 * Parses (multiple) values into an `string[]`.
 *
 * @param {string}               flag Flag-Name
 * @param {string|string[]}      [values] Values
 * @param {string[]} knownValues Known values for the flag.
 *
 * @example
 * parseMultipleValues('formats'  , "svg", FORMATS)             -> ["svg"]
 * parseMultipleValues('formats'  , "svg woff2", FORMATS)       -> ["svg", "woff2"]
 * parseMultipleValues('formats'  , "[svg, woff2]", FORMATS)    -> ["svg", "woff2"]
 * parseMultipleValues('formats'  , "[svg, unknown]", FORMATS)  -> ["[svg, unknown]"]
 * parseMultipleValues('templates', "css", TEMPLATES)                                       -> ["css"]
 * parseMultipleValues('templates', "css html", TEMPLATES)                                  -> ["css", "html"]
 * parseMultipleValues('templates', "[css, html]", TEMPLATES)                               -> ["css", "html"]
 * parseMultipleValues('templates', "[css, unknown]", TEMPLATES)                            -> ["[css, unknown]"]
 * parseMultipleValues('templates', ["css html", "./templates/custom.html.njk"], TEMPLATES) -> ["css", "html", "./templates/custom.html.njk"]
 *
 * @returns {undefined|string[]}
 */
function parseMultipleValues( flag, values, knownValues )
{
  const knownValuesOnlyExp = new RegExp(`\\[?(\\s*(${knownValues.join('|')})\\s*,?)+\\]?`);
  let  parsedValues       = [];

  if (!values) { return void 0;}
  else if (typeof values === 'string')
  {
    if (values.match(knownValuesOnlyExp))
    {
      // For backwards compatibility support "[value1 value2]" and "[value1, value2]" notation.
      if (values.startsWith('[')) { values = values.substring(1, values.length-1); }
      return values.split(/\s+|\s*,\s*/).filter(value => value.length > 0);
    }
    else
    {
      return [values];
    }
  }
  else if (Array.isArray(values)) {
    values.forEach((value) => {
      parsedValues = parsedValues.concat(parseMultipleValues(flag, value, knownValues));
    });

    return parsedValues;
  }

  process.stderr.write(`Unsupported parameter value --${flag} ${values}\n`);

  return void 0;
}
