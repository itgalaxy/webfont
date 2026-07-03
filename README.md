# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Node.js CI](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml/badge.svg)](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml)

Generator of fonts from SVG icons, with separate modes to **encode** TTF to web formats and **decompress** WOFF/WOFF2 containers to the TTF or OTF inside.

See **[FEATURES.md](./FEATURES.md)** for the canonical capability list (what is stable, in progress, or planned).

**Legal / licensing:** [NOTICE.md](./NOTICE.md) — font copyright, disclaimers, attribution guidelines, and third-party library notices.

**Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common errors on the current release (including [icons that lose detail after export](./TROUBLESHOOTING.md#icon-details-missing-after-export) due to `fill-rule: evenodd`, #175).

**Migration:** [MIGRATION.md](./MIGRATION.md) — what changed between versions and how to upgrade.

## Features

- **SVG icon pipeline** (default): `.svg` icons → `svg`, `ttf`, `eot`, `woff`, `woff2` (not `otf`);
- **TTF encoding**: one or more `.ttf` files → `ttf` (pass-through), `eot`, `woff`, and/or `woff2` (auto-detected — no extra flag);
- **Webfont decompression**: one `.woff` or `.woff2` file → `ttf` and/or `otf` matching the **embedded SFNT flavor** (decompress only — not TTF ↔ OTF transcoding);
- Config files: `JavaScript`, `JSON`, or `YAML` via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig);
- Built-in and custom CSS templates (`css`, `scss`, [`styl`](https://github.com/itgalaxy/webfont/pull/164/));
- CLI and programmatic API (**Node.js build time only** — see [TROUBLESHOOTING](./TROUBLESHOOTING.md#cant-resolve-fs-webpack--react--vite-client-bundle));
- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin).

## Input modes

webfont runs one of three pipelines depending on matched input files. They cannot be mixed in a single run.

| Mode | Input | Outputs | Notes |
|------|--------|---------|--------|
| **SVG icons** | One or more `.svg` files | `svg`, `ttf`, `eot`, `woff`, `woff2` | Default. Builds TrueType via `svg2ttf`. **`otf` is rejected** — use `ttf`. |
| **TTF encoding** | One or more `.ttf` files | `ttf`, `eot`, `woff`, and/or `woff2` per input | Auto-detected. Default when SVG-pipeline `formats` are still configured: `woff` + `woff2`. No templates. |
| **Webfont decompress** | One or more `.woff` / `.woff2` paths, globs, or `http(s)` URLs | `ttf` and/or `otf` per input | One output file per source (basename from filename; collisions get `-woff`/`-woff2`). Not a single merged font. |

**Not supported today**

- Renaming or re-wrapping without matching the real outline format (e.g. requesting `otf` when the WOFF2 holds TrueType).
- Converting TTF to OTF (or OTF to TTF) — use [FontForge](https://fontforge.org/) or similar.
- `.otf` as input for webfont encoding (TrueType `.ttf` only today).
- Templates, `glyphTransformFn`, `glyphContentTransformFn`, or merged multi-weight SFNT output in TTF encoding or webfont decompress mode.
- Globs that match extension-less or unsupported files together with fonts (the run fails instead of silently ignoring extras).

Every matched path must end in `.svg`, `.ttf`, `.woff`, or `.woff2`. See [FEATURES.md](./FEATURES.md) for test-backed criteria.

### Font licensing

webfont is a technical tool. **Decompressing or generating fonts does not grant you any rights to those fonts.** You must have permission to use, convert, and redistribute every input file and every output file under the applicable license (commercial fonts, app-bundled webfonts, client icons, etc.). The MIT license applies to **this software only**, not to fonts you pass through it.

Full details, disclaimers, community attribution guidelines, and third-party library notices: **[NOTICE.md](./NOTICE.md)**.

## Table Of Contents

- [Webfont](#webfont)
  - [Features](#features)
  - [Input modes](#input-modes)
  - [Font licensing](#font-licensing)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Options](#options)
  - [Result](#result)
  - [svgicons2svgfont](#svgicons2svgfont)
- [Command Line Interface (CLI)](#command-line-interface)
  - [Installation](#cli-installation)
  - [Usage](#cli-usage)
  - [Exit Codes](#cli-exit-codes)
- [Related](#related)
- [Roadmap](#roadmap)
- [Contribution](#contribution)
- [Changelog](#changelog)
- [Legal notice](#legal-notice)
- [License](#license)

---

## Installation

Requires **Node.js** >= 24.14.0. Install as a dev dependency and run at **build time** (CLI, npm script, or bundler plugin) — not from browser/React client bundles.

```shell
npm install --save-dev webfont
```

## Usage

Node.js only — do not import from client-side app code ([#198](https://github.com/itgalaxy/webfont/issues/198)).

```js
import webfont from "webfont";

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
})
  .then((result) => {
    // Do something with result
    Function.prototype(result);
    // Or return it
    return result;
  })
  .catch((error) => {
    throw error;
  });
```

or

```js
const webfont = require("webfont").default;

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
})
  .then((result) => {
    // Do something with result
    Function.prototype(result);
    // Or return it
    return result;
  })
  .catch((error) => {
    throw error;
  });
```

### TTF encoding examples

```js
import webfont from "webfont";

// Single local TTF → WOFF + WOFF2 (default when formats unset)
const encoded = await webfont({
  files: "path/to/font.ttf",
});

// Explicit formats
const subset = await webfont({
  files: "path/to/font.ttf",
  formats: ["woff2"],
});

// Batch: multiple TTF files in one run
const batch = await webfont({
  files: ["fonts/Inter-Regular.ttf", "fonts/Inter-Bold.ttf"],
  formats: ["woff", "woff2"],
});
// batch.transcodedFonts → [{ source, woff, woff2 }, …]
```

### Webfont decompress examples

```js
import webfont from "webfont";

// Single local file
const one = await webfont({
  files: "path/to/font.woff2",
  formats: ["ttf"],
});

// Batch: multiple files in one run (one TTF/OTF output per input)
const batch = await webfont({
  files: ["fonts/Inter-Regular.woff2", "fonts/Inter-Bold.woff2"],
  formats: ["ttf"],
});
// batch.decompressedFonts → [{ source, ttf }, …]

// Remote URL (http or https)
const remote = await webfont({
  files: "https://cdn.example.com/fonts/Inter-Medium.woff2",
  formats: ["ttf"],
});
```

### Options

#### `files`

- Type: `string` | `array`
- Description: A file glob, or array of file globs. Ultimately passed to [fast-glob](https://github.com/mrmlnc/fast-glob) to figure out what files you want to get.
- **SVG mode**: one or more `.svg` icon paths or globs (default pipeline).
- **TTF encoding mode**: one or more `.ttf` paths or globs.
- **Webfont decompress mode**: one or more `.woff` / `.woff2` paths, globs, or `https://…` URLs (see [`formats`](#formats) and [Input modes](#input-modes)).
- Do not mix `.svg`, `.ttf`, and `.woff` / `.woff2` in the same run.
- Every matched file must have a supported extension (`.svg`, `.ttf`, `.woff`, `.woff2`); extension-less files such as `LICENSE` are not ignored when matched by a broad glob.
- `node_modules` and `bower_components` are always ignored.

#### `configFile`

- Type: `string`
- Description: Path to a specific configuration file `(JSON, YAML, or CommonJS)` or the name of a module in `node_modules` that points to one.
- Note: If you do not provide `configFile`, webfont will search up the directory tree for configuration file in the following places, in this order:
  1. a `webfont` property in `package.json`
  2. a `.webfontrc` file (with or without filename extension: `.json`, `.yaml`, and `.js` are available)
  3. a `webfont.config.js` file exporting a JS `object`.
     The search will begin in the working directory and move up the directory tree until it finds a configuration file.
- Note: When a configuration file is discovered or loaded, the resolved absolute path is available on `result.config.filePath` (see [Result](#result)).

#### `fontName`

- Type: `string`
- Default: `webfont`
- Description: The font family name you want.

#### `formats`

- Type: `array`
- Default: `['svg', 'ttf', 'eot', 'woff', 'woff2']` (SVG input). For TTF input, defaults to `['woff', 'woff2']` when SVG-pipeline formats are still configured. For WOFF/WOFF2 input, defaults to `['ttf']` when SVG-pipeline formats are still configured.
- Possible values: `svg`, `ttf`, `otf`, `eot`, `woff`, `woff2`
- Description: Font file types to generate.
  - **SVG input**: `svg`, `ttf`, `eot`, `woff`, `woff2` only. **`otf` is not supported** (pipeline uses TrueType outlines).
  - **TTF input**: `ttf`, `eot`, `woff`, and/or `woff2` only. **`svg` and `otf` are not produced** in this mode.
  - **WOFF/WOFF2 input**: `ttf` and/or `otf` only — must match the decompressed SFNT flavor inside the file (not arbitrary transcoding). `eot`, `woff`, `woff2`, and `svg` are not produced in this mode.
- CLI: pass `-f` / `--formats` as a JSON array (for example `'["woff2"]'`) or as a comma-separated list (for example `woff2` or `svg, ttf, woff2`). Invalid format names throw an error.
- API and config files: `formats` must be an array of the values above; unknown names (for example `icon`) throw before the pipeline runs.

#### `template`

- Type: `string` or `string[]`
- Default: `null`
- Possible values: `css`, `scss`, `styl`, `html`, `json` (feel free to contribute more), or a path to a custom `.njk` template.
- Pass an **array** to generate multiple outputs in one run (for example `['html', 'scss']` for preview + styles, #158).
- CLI: pass `-t` / `--template` as a single name, a JSON array (`'["html","scss"]'`), or a comma-separated list (`html,scss`).
- Note: If you want to use a custom template use this option pass in a path `string` like this:

  ```js
  webfont({
    template: "./path/to/my-template.css",
  });
  ```

  Or

  ```js
  webfont({
    template: path.resolve(__dirname, "./my-template.css"),
  });
  ```

  Or

  ```js
  webfont({
    template: path.resolve(__dirname, "./my-template.styl"),
  });
  ```

#### `templateClassName`

- Type: `string`
- Default: `null`
- Description: Default font class name.

#### `templateFontPath`

- Type: `string`
- Default: `./`
- Description: Path to generated fonts in the `CSS` file.

#### `templateFontName`

- Type: `string`
- Default: Gets is from `fontName` if not set, but you can specify any value.
- Description: Template font family name you want.

#### `templateCacheString`

- Type: `string`
- Default: `Date.now()` at generation time
- Description: Query string appended to font `url(...)` values in built-in templates (before optional `&v=` hash). Use a fixed value (for example `v=1`) when you only need manual cache busting; pair with [`addHashInFontUrl`](#addhashinfonturl) for automatic content-based busting.

#### `addHashInFontUrl`

- Type: `boolean`
- Default: `false`
- Description: When `true` and a built-in `template` is used, append `&v=<md5>` to each font URL in the generated CSS/SCSS/Styl. The hash is derived from the SVG font output — it changes only when icon data changes. **Output filenames stay** `fontName.woff2`, `fontName.scss`, etc. (stable `@import` paths).
- CLI: `--addHashInFontUrl`
- Addresses browser cache issues without renaming font files on every build ([#125](https://github.com/itgalaxy/webfont/issues/125)).

**Example — stable `webfont.scss`, cache-busted font URLs:**

```shell
webfont "icons/*.svg" -d dist/icons -t scss --addHashInFontUrl
```

```js
import webfont from "webfont";

await webfont({
  files: "src/icons/**/*.svg",
  fontName: "webfont",
  template: "scss",
  templateFontPath: "./fonts/",
  addHashInFontUrl: true,
});
// Writes dist/icons/webfont.scss and dist/icons/webfont.woff2 (fixed names).
// SCSS contains url("./fonts/webfont.woff2?...&v=<md5>") — hash updates when icons change.
```

Do **not** use `Math.random()` in `fontName` — that renames both font files and the stylesheet on every run.

#### `unicodeRange`

- Type: `boolean | string`
- Default: `true` (auto-computed from glyph code points)
- Description: When a built-in `template` is used, emit a `unicode-range` declaration in `@font-face` so the browser can load only the icon font that owns the code points on the page. With the default `startUnicode` (`0xEA01`), the range is derived from the minimum and maximum allocated code points (for example `U+EA01-EA03`). Set to `false` to omit the rule, or pass a CSS value string (for example `U+EA01-EAFF`) to override the computed range.
- CLI: `--no-unicode-range` to disable
- Helps when multiple icon fonts share a page ([#322](https://github.com/itgalaxy/webfont/issues/322)).

#### `ligatures`

- Type: `boolean`
- Default: `true`
- Description: Turn on/off adding ligature unicode

#### `glyphTransformFn`

- Type: `function`
- Default: `null`
- Description: If you want to transform glyph metadata (e.g. titles of CSS classes or unicode) before transferring it in your style template for your icons, you can use this option with glyphs metadata object.
- Example:

  ```js
  import webfont from "webfont";

  webfont({
    files: "src/svg-icons/**/*.svg",
    glyphTransformFn: (obj) => {
      obj.name += "_transform";
      something();

      return obj;
    },
  })
    .then((result) => {
      // Do something with result
      Function.prototype(result);
      // Or return it
      return result;
    })
    .catch((error) => {
      throw error;
    });
  ```

#### `glyphContentTransformFn`

- Type: `function`
- Default: `null`
- Description: Transform each SVG glyph **before** font generation (SVG pipeline only). Use this to preprocess stroke-based icons into filled paths, for example with [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke). `glyphTransformFn` only changes metadata; this hook receives the full `GlyphData` (`contents`, `srcPath`, optional `metadata`) and must return the new SVG string.
- Example (stroke icons, #144):

  ```js
  import outlineStroke from "svg-outline-stroke";
  import webfont from "webfont";

  await webfont({
    files: "src/svg-icons/**/*.svg",
    glyphContentTransformFn: async (glyph) => outlineStroke(glyph.contents),
  });
  ```

  For better trace quality with `svg-outline-stroke`, use a larger `width` / `height` / `viewBox` on the source SVG (see the library README).

#### `optimizeSvg`

- Type: `boolean`
- Default: `false`
- Description: When `true`, run a **conservative** [SVGO](https://github.com/svg/svgo) pass on each SVG **after** diagnostics and **before** `glyphContentTransformFn`. Removes editor cruft (comments, metadata, doctype) without rewriting paths or removing `viewBox`. Does **not** convert stroke-only artwork to fills — pair with [`glyphContentTransformFn`](#glyphcontenttransformfn) for stroke icons ([#327](https://github.com/itgalaxy/webfont/issues/327), [#724](https://github.com/itgalaxy/webfont/issues/724)).
- CLI: `--optimize-svg`
- Optional: `svgoConfig` — SVGO `Config` object; when `plugins` is set, it replaces the built-in conservative plugin list.

  ```js
  import webfont from "webfont";

  await webfont({
    files: "src/icons/**/*.svg",
    optimizeSvg: true,
    glyphContentTransformFn: async (glyph) => {
      // optional: stroke-to-fill after SVGO cleanup
      return glyph.contents;
    },
  });
  ```

#### `svgTools` (alpha)

- Type: `{ diagnose?: boolean; onMessage?: (message: string) => void }`
- Default: `undefined` (disabled)
- Description: **Alpha.** Scan SVG sources for icon-font incompatibilities before font generation (SVG pipeline only). Does **not** modify SVGs — use [`glyphContentTransformFn`](#glyphcontenttransformfn) to preprocess (for example stroke-to-fill with [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke), installed in your project). See [ADR 0011](docs/adr/0011-no-svg-outline-stroke-dependency.md).
  - **`diagnose`:** log warnings for `fill-rule: evenodd`, stroke-only paths (`fill="none"` + `stroke`), and poorly supported elements (`<line>`, `<polyline>`, `<clipPath>`). Results are also returned on `result.svgDiagnostics` when enabled.
  - **`onMessage`:** optional sink for diagnostic log lines (tests, custom UIs).
- CLI: `--svg-diagnose` (alpha).
- Example:

  ```js
  import webfont from "webfont";

  const result = await webfont({
    files: "src/icons/**/*.svg",
    svgTools: { diagnose: true },
  });

  console.log(result.svgDiagnostics);
  ```

  See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — “Icon details missing after export”.

#### `metadataProvider`

- Type: `function`
- Default: built-in metadata service (reads icon names and unicode from SVG files)
- Description: Custom callback to resolve glyph metadata for each source file. Receives the file path and a Node-style callback `(error, metadata)` where `metadata` is `{ name: string, unicode?: string | string[] }`. When omitted, webfont uses its default metadata reader.

  ```js
  import webfont from "webfont";

  webfont({
    files: "src/svg-icons/**/*.svg",
    metadataProvider: (srcPath, callback) => {
      callback(null, { name: "custom-icon-name" });
    },
  });
  ```

#### `sort`

- Type: `bool`
- Default: `true`
- Description: Whether you want to sort the icons sorted by name.

### Result

`webfont()` resolves to an object with generated font buffers (and optional `template` output). The `config` property contains the **effective options** used for the run (defaults, discovered config, and any options you passed in), plus optional **output metadata** when a configuration file was found or loaded.

#### `result.config.filePath`

- Type: `string` | `undefined`
- Description: Absolute path to the configuration file that was discovered (`search`) or loaded (`configFile` / CLI `--config`). Omitted when no configuration file was found and defaults were used.
- Note: Output-only metadata — not an input option. Do not set `filePath` in `.webfontrc`, `package.json`, or the `webfont()` call; values passed that way are ignored.
- Example:

  ```js
  const result = await webfont({
    files: "src/svg-icons/**/*.svg",
  });

  if (result.config?.filePath) {
    console.log(`Loaded config from ${result.config.filePath}`);
  }
  ```

---

## svgicons2svgfont

### svgicons2svgfont options

These can be appended to [webfont options](#options). These are passed directly to [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont).

#### `svgicons2svgfont.fontName`

- Type: `string`
- Default: Taken from the [webfont fontName option](#fontname)
- Description: The font family name you want.

#### `svgicons2svgfont.fontId`

- Type: `string`
- Default: The `fontName` value
- Description: The font id you want.

#### `svgicons2svgfont.fontStyle`

- Type: `string`
- Default: `''`
- Description: The font style you want.

#### `svgicons2svgfont.fontWeight`

- Type: `string`
- Default: `''`
- Description: The font weight you want.

#### `svgicons2svgfont.fixedWidth`

- Type: `boolean`
- Default: `false`
- Description: Creates a monospace font of the width of the largest input icon.

#### `svgicons2svgfont.centerHorizontally`

- Type: `boolean`
- Default: `false`
- Description: Calculate the bounds of a glyph and center it horizontally.

#### `svgicons2svgfont.normalize`

- Type: `boolean`
- Default: `false`
- Description: Normalize icons by scaling them to the height of the highest icon.

#### `svgicons2svgfont.fontHeight`

- Type: `number`
- Default: `MAX(icons.height)`
- Description: The outputted font height (defaults to the height of the highest input icon).

#### `svgicons2svgfont.round`

- Type: `number`
- Default: `10e12` Setup SVG path rounding.

#### `svgicons2svgfont.descent`

- Type: `number`
- Default: `0`
- Description: The font descent. It is useful to fix the font baseline yourself.
- Warning: The descent is a positive value!.

#### `svgicons2svgfont.ascent`

- Type: `number`
- Default: `fontHeight - descent`
- Description: The font ascent. Use this options only if you know what you're doing. A suitable value for this is computed for you.

#### `svgicons2svgfont.metadata`

- Type: `string`
- Default: `undefined`
- Description: The font [metadata](http://www.w3.org/TR/SVG/metadata.html).
  You can set any character data in, but this is the recommended place for a copyright mention.

---

## Command Line Interface

The interface for command-line usage is fairly simplistic at this stage, as seen in the following usage section.

### CLI Installation

Add the `cli` script to your `package.json` file's `scripts` object:

```json
{
  "scripts": {
    "webfont": "node node_modules/webfont/dist/cli.mjs"
  }
}
```

If you're using cross-env:

```json
{
  "scripts": {
    "webfont": "cross-env node_modules/webfont/dist/cli.mjs"
  }
}
```

### CLI Usage

```shell
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

            Type of template (\`css\`, \`scss\`, \`styl\`) or path to custom template.
'
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

        --svg-diagnose

            (Alpha) Scan SVG icons for icon-font incompatibilities and log warnings.

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

```

### CLI Exit Codes

The CLI can exit the process with the following exit codes:

- 0: All ok.
- 1: Something unknown went wrong.
- Other: related to using packages.

---

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) - `webpack` plugin.
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) - Simple tool to merge multiple icons to an SVG font.
- [svg2ttf](https://github.com/fontello/svg2ttf) - Converts SVG fonts to TTF format.
- [ttf2eot](https://github.com/fontello/ttf2eot) - Converts TTF fonts to EOT format.
- [ttf2woff](https://github.com/fontello/ttf2woff) - Converts TTF fonts to WOFF format.
- [wawoff2](https://github.com/fontello/wawoff2) - Converts TTF fonts to WOFF2 and versa vice.

## Roadmap

- Arbitrary format transcoding (e.g. TTF ↔ OTF outline conversion) — see [FEATURES.md](./FEATURES.md) (“Arbitrary format transcoding”, planned);
- Reduce package size (maybe implement `ttf2woff2` with a native JS library);
- Improve performance (maybe use cache for this).

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## Changelog

Check our [Changelog](CHANGELOG.md)

## Legal notice

Copyright, disclaimers, font licensing expectations (including WOFF/WOFF2 decompression), community attribution guidelines, and third-party open-source dependencies are documented in **[NOTICE.md](./NOTICE.md)**.

## License

The **webfont software** is licensed under the [MIT License](./LICENSE). That license does **not** apply to fonts or icons you process with the tool — see [NOTICE.md](./NOTICE.md).
