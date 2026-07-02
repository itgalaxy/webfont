export const WEBFONT_CLI_HELP_MARKERS = [
  "Usage: webfont [input] [options]",
  "--config",
  "--fontName",
  "--formats",
  "--dest-create",
  "--no-sort",
  "--no-ligatures",
  "--addHashInFontUrl",
] as const;

export const webfontCliHelpText = `
    Usage: webfont [input] [options]

    Input: File(s) or glob(s).

        SVG icons: one or more \`.svg\` files (default pipeline).
        Webfont conversion: a single \`.woff\` or \`.woff2\` file to decompress to TTF/OTF.
            You must have rights to any font file you process (see NOTICE.md).

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

        -u, --fontName

            The font family name you want, default: "webfont".

        -h, --help

            Output usage information.

        -v, --version

            Output the version number.

        -f, --formats

            Font formats to generate. Pass a JSON array (e.g. '["woff2"]') or a
            comma-separated list (e.g. woff2 or svg, ttf, woff2).
            SVG input: svg, ttf, eot, woff, woff2 (not otf).
            WOFF/WOFF2 input: ttf and/or otf matching the embedded SFNT flavor.

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
`;

export const webfontMeowFlags = {
  ascent: {
    type: "string",
  },
  centerHorizontally: {
    type: "boolean",
  },
  config: {
    type: "string",
  },
  descent: {
    type: "string",
  },
  dest: {
    shortFlag: "d",
    default: process.cwd(),
    type: "string",
  },
  destCreate: {
    shortFlag: "m",
    default: false,
    type: "boolean",
  },
  destTemplate: {
    shortFlag: "s",
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
    shortFlag: "u",
    type: "string",
  },
  fontStyle: {
    type: "string",
  },
  fontWeight: {
    type: "string",
  },
  formats: {
    shortFlag: "f",
    type: "string",
  },
  help: {
    shortFlag: "h",
    type: "boolean",
  },
  ligatures: {
    default: true,
    type: "boolean",
  },
  metadata: {
    type: "string",
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
    shortFlag: "t",
    type: "string",
  },
  templateClassName: {
    shortFlag: "c",
    type: "string",
  },
  templateFontName: {
    shortFlag: "n",
    type: "string",
  },
  addHashInFontUrl: {
    default: false,
    type: "boolean",
  },
  templateFontPath: {
    shortFlag: "p",
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
    shortFlag: "v",
    type: "boolean",
  },
} as const;
