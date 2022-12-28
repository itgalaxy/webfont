/* eslint-disable max-len, sort-keys */
import meow from "meow";

const meowCLI = meow(`
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

        -f, --fontName

            The font family name you want, default: "webfont".

        -h, --help

            Output usage information.

        -v, --version

            Output the version number.

        -r, --formats

            Only this formats generate.

        -d, --dest

            Destination for generated fonts.

        -m, --dest-create

            Create destination directory if it does not exist.

        -t, --template

            Type of template ('css', 'scss', 'styl') or path to custom template.

        -s, --destTemplate

            Destination for generated template. If not passed used \`dest\` argument value.

        -c, --templateClassName

            Class name in css template.

        -p, --templateFontPath

            Font path in css template.

        -n, --templateFontName

            Font name in css template.

        --templateCacheString

            Specify cache string in scss/css template.

        --no-sort

            Keeps the files in the same order of entry

        --no-ligatures

            Prevents adding ligature unicode

        --verbose

            Tell me everything!.

    For "svgicons2svgfont":

        --fontId

            The font id you want, default as "--fontName".

        --fontStyle

            The font style you want.

        --fontWeight

            The font weight you want.

        --fixedWidth

            Creates a monospace font of the width of the largest input icon.

        --centerHorizontally

            Calculate the bounds of a glyph and center it horizontally.

        --centerVertically

            Centers the glyphs vertically in the generated font.

        --normalize

            Normalize icons by scaling them to the height of the highest icon.

        --fontHeight

            The outputted font height [MAX(icons.height)].

        --round

            Setup the SVG path rounding [10e12].

        --descent

            The font descent [0].

        --ascent

            The font ascent [height - descent].

        --startUnicode

            The start unicode codepoint for files without prefix [0xEA01].

        --prependUnicode

            Prefix files with their automatically allocated unicode codepoint.

        --metadata

            Content of the metadata tag.

        --addHashInFontUrl

            Generated font url will be : [webfont].[ext]?v=[hash]
`, {
  autoHelp: false,
  autoVersion: false,
  flags: {
    ascent: {
      type: "string",
    },
    centerHorizontally: {
      type: "boolean",
    },
    centerVertically: {
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
    destCreate: {
      alias: "m",
      default: false,
      type: "boolean",
    },
    destTemplate: {
      alias: "s",
      type: "string",
    },
    fixedWidth: {
      type: "boolean",
    },
    fontHeight: {
      type: "string",
    },
    fontId: {
      type: "string",
    },
    fontName: {
      alias: "u",
      type: "string",
    },
    fontStyle: {
      type: "string",
    },
    fontWeight: {
      type: "string",
    },
    formats: {
      alias: "f",
    },
    help: {
      alias: "h",
      type: "boolean",
    },
    ligatures: {
      default: true,
      type: "boolean",
    },
    normalize: {
      type: "boolean",
    },
    prependUnicode: {
      type: "boolean",
    },
    round: {
      type: "string",
    },
    sort: {
      default: true,
      type: "boolean",
    },
    startUnicode: {
      type: "string",
    },
    template: {
      alias: "t",
      type: "string",
    },
    templateClassName: {
      alias: "c",
      type: "string",
    },
    templateFontName: {
      alias: "n",
      type: "string",
    },
    addHashInFontUrl: {
      default: false,
      type: "boolean",
    },
    templateFontPath: {
      alias: "p",
      type: "string",
    },
    templateCacheString: {
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
});

export default meowCLI;
