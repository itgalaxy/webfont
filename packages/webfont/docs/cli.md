# Command Line Interface

The interface for command-line usage is fairly simplistic at this stage, as seen in the usage section below.

Install the package and wire the CLI script first: [Install guide](https://webfont.js.org/introduction/install) ([source](../install.md)).

## Usage

<!-- cli-docs:generated -->
> **Maintainers:** CLI help is generated from `packages/webfont/src/cli/meow/cliFlagCatalog.ts`. After editing flag metadata, run `npm run docs:cli` at the repo root (unit tests also guard drift).

```shell
    Usage: webfont [input] [options]

    Input: File(s) or glob(s).

        SVG icons: one or more `.svg` files (default pipeline).
        Webfont decompression: one or more `.woff` / `.woff2` paths, globs, or http(s) URLs.
            You must have rights to any font file you process (see NOTICE.md).

        If an input argument is wrapped in quotation marks, it will be passed to "fast-glob"
        for cross-platform glob support.

    Options:

        --assistant

            Interactive wizard (webfont-assistant style): prompts for font name, icon prefix,
            glyph/output paths, formats, and built-in or custom templates; writes a `.was` config.

        --assistant-config

            Path to a `.was` file (webfont-assistant format). The file contents may be a single
            config object or a JSON array of configs; this flag is not inline JSON.
            Distinct from `--config` (cosmiconfig).

        --config

            Path to a specific configuration file (JSON, YAML, or CommonJS)
            or the name of a module in `node_modules` that points to one.
            If no `--config` argument is provided, webfont will search for
            configuration  files in the following places, in this order:
               - a `webfont` property in `package.json`
               - a `.webfontrc` file (with or without filename extension:
                   `.json`, `.yaml`, and `.js` are available)
               - a `webfont.config.js` file exporting a JS object
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

            Built-in template name(s) ('css', 'scss', 'styl', 'html', 'json') or path to a custom template.
            Pass a JSON array (e.g. '["html","scss"]') or comma-separated list for multiple outputs.

        -s, --destTemplate

            Destination for generated template. If not passed used `dest` argument value.

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

        --ligatures

            Add OpenType ligature glyphs (icon names as text). Off by default — large
            icon sets can hang Firefox on Windows (#558). Prefer class + codepoint CSS.

        --unicode-range

            Emit unicode-range in built-in @font-face rules (computed from glyph code points).
            Off by default — enabling may prevent ligature names from rendering; see README.

        --no-template-font-ligatures

            Omit font-feature-settings: "liga" from the built-in HTML preview template

        --optimize-svg

            Run a conservative SVGO pass on each SVG before font generation
            (does not convert strokes to fills; use glyphContentTransformFn for that)

        --verbose

            Tell me everything!.

        --svg-diagnose

            (Alpha) Scan SVG icons for icon-font incompatibilities (stroke-only paths,
            fill-rule: evenodd, unsupported elements) and log warnings.

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

            Center the glyphs vertically in the generated font.

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

            Append an MD5 content hash to font URLs in built-in templates
            (?v=[hash]) while keeping output filenames stable (fontName.woff2, etc.).
            Use with a fixed fontName — do not randomize fontName for cache busting.
```

## Exit codes

The CLI can exit the process with the following exit codes:

- **0** — All ok.
- **1** — Something unknown went wrong.
- **Other** — Related to using packages.
