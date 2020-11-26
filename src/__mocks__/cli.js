import pkg from "../../package.json";

const cli = Object.create(null);

cli.verbose = function (destination) {
  return `Collection SVGs for 'src/__tests__/fixtures/svg-icons'
Rendering glyphs for 'webfont'
Rendering svg format for 'webfont'
The provided icons do not have the same heights. This could lead to unexpected results. Using the normalize option may help.
A fontHeight of at least than 1000 is recommended, otherwise further steps (rounding in svg2ttf) could lead to ugly results. Use the fontHeight option to scale icons.
Font created
Rendering ttf format for 'webfont'
Rendering fonts for formats'svg, ttf, eot, woff, woff2'
Rendering eof format for 'webfont'
Rendering woff format for 'webfont'
Rendering woff2 format for 'webfont'
Writing font-file 'svg' -> '${destination}webfont.svg' (19271)
Writing font-file 'ttf' -> '${destination}webfont.ttf' (3296)
Writing font-file 'eot' -> '${destination}webfont.eot' (3460)
Writing font-file 'woff' -> '${destination}webfont.woff' (1940)
Writing font-file 'woff2' -> '${destination}webfont.woff2' (1444)
Writing font-file 'hash' -> '${destination}webfont.hash' (32)`;
};

cli.error = function () {
  return "Error: Files glob patterns specified did not match any files";
};

cli.showVersion = function () {
  return pkg.version;
};

cli.showHelp = function () {
  return `
  Generator of fonts from svg icons, svg icons to svg font, svg font to ttf, ttf to eot, ttf to woff, ttf to woff2

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

          Limit output-formats to the specified types (svg, ttf, eof, woff, woff2).
          --formats svg
          --formats "svg woff2"

      -d, --dest

          Destination for generated fonts.

      -t, --template

          Type of template (css, scss, styl, html) or path to custom template.
          Whitespace-separated built-in template types "css html" to process multiple templates.
          Path containing whitespaces require an separate use of this flag for each path.
          --template css
          --template "css scss"
          -t "/templates/template name with whitespaces.css.njk" -t "/templates/another template.scss.njk"

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
`;
};

export default cli;
