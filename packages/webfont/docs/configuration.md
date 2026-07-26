# Configuration

Reference for `webfont()` options, cosmiconfig files, and svgicons2svgfont parameters. CLI flags map to the same names — see the [CLI reference](./cli.md).

## Result

`webfont()` resolves to an object with generated font buffers (and optional `template` output). The `config` property contains the **effective options** used for the run (defaults, discovered config, and any options you passed in), plus optional **output metadata** when a configuration file was found or loaded.

`Result` and `ResultConfig` are exported from the package entry:

```ts
import { webfont, type Result, type ResultConfig } from "webfont";

const result: Result = await webfont({ files: "src/svg-icons/**/*.svg" });
const config: ResultConfig | undefined = result.config;
```

### `result.config.filePath`

- Type: `string` | `undefined`
- Description: Absolute path to the configuration file that was discovered or loaded. Omitted when no configuration file was found and defaults were used.
- Note: Output-only metadata — not an input option. Do not set `filePath` in `.webfontrc`, `package.json`, or the `webfont()` call.

### Writing results to disk

The API does not write files by itself. Pass `dest` (and `destCreate: true` when the folder may not exist), then call `writeResultFiles` — the same helper the CLI uses:

```ts
import { webfont, writeResultFiles } from "webfont";

const result = await webfont({
  files: "src/icons/**/*.svg",
  fontName: "icons",
  formats: ["woff2"],
  template: "css",
  dest: "dist/fonts",
  destCreate: true,
});

await writeResultFiles(result);
```

Grunt integration: [Grunt guide](./grunt.md).

## files

- Type: `string` | `array`
- Description: A file glob, or array of file globs. Ultimately passed to [fast-glob](https://github.com/mrmlnc/fast-glob) to figure out what files you want to get.
- **SVG mode**: one or more `.svg` icon paths or globs (default pipeline).
- **TTF encoding mode**: one or more `.ttf` paths or globs.
- **Webfont decompress mode**: one or more `.woff` / `.woff2` paths, globs, or `https://…` URLs (see [`formats`](#formats) and [Capabilities at a glance](../../README.md#capabilities-at-a-glance)).
- Do not mix `.svg`, `.ttf`, and `.woff` / `.woff2` in the same run.
- Every matched file must have a supported extension (`.svg`, `.ttf`, `.woff`, `.woff2`); extension-less files such as `LICENSE` are not ignored when matched by a broad glob.
- `node_modules` and `bower_components` are always ignored.

## configFile

- Type: `string`
- Description: Path to a specific configuration file `(JSON, YAML, or CommonJS)` or the name of a module in `node_modules` that points to one.
- Note: If you do not provide `configFile`, webfont will search up the directory tree for configuration file in the following places, in this order:
  1. a `webfont` property in `package.json`
  2. a `.webfontrc` file (with or without filename extension: `.json`, `.yaml`, and `.js` are available)
  3. a `webfont.config.js` file exporting a JS `object`.
     The search will begin in the working directory and move up the directory tree until it finds a configuration file.
- Note: When a configuration file is discovered or loaded, the resolved absolute path is available on `result.config.filePath` (see [Result](#result)).

## fontName

- Type: `string`
- Default: `webfont`
- Description: The font family name you want.

## formats

- Type: `array`
- Default: `['svg', 'ttf', 'eot', 'woff', 'woff2']` (SVG input). For TTF input, defaults to `['woff', 'woff2']` when SVG-pipeline formats are still configured. For WOFF/WOFF2 input, defaults to `['ttf']` when SVG-pipeline formats are still configured.
- Possible values: `svg`, `ttf`, `otf`, `eot`, `woff`, `woff2`
- Description: Font file types to generate.
  - **SVG input**: `svg`, `ttf`, `eot`, `woff`, `woff2` only. **`otf` is not supported** (pipeline uses TrueType outlines).
  - **TTF input**: `svg` (SVG font), `ttf`, `eot`, `woff`, and/or `woff2`. `svg` is **opt-in** (not in the default `woff` + `woff2` set); **`otf` is not produced** in this mode.
  - **WOFF/WOFF2 input**: `ttf` and/or `otf` only — must match the decompressed SFNT flavor inside the file (not arbitrary transcoding). `eot`, `woff`, `woff2`, and `svg` are not produced in this mode.
- CLI: pass `-f` / `--formats` as a JSON array (for example `'["woff2"]'`) or as a comma-separated list (for example `woff2` or `svg, ttf, woff2`). Invalid format names throw an error.
- API and config files: `formats` must be an array of the values above; unknown names (for example `icon`) throw before the pipeline runs.

## template

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

## templateClassName

- Type: `string`
- Default: `null`
- Description: Default font class name.

## templateFontPath

- Type: `string`
- Default: `./`
- Description: Path to generated fonts in the `CSS` file.

## templateFontName

- Type: `string`
- Default: Same as [`fontName`](#fontname) when not set.
- Description: CSS `font-family` name emitted by built-in templates (`fontFamily` in Nunjucks context). Output **font files** are always named after `fontName` (for example `icons-a.woff2`); built-in templates reference those files with Nunjucks `fontName` / `fontFamily` placeholders in `url(...)` and `font-family` ([#331](https://github.com/itgalaxy/webfont/issues/331)).

## templateCacheString

- Type: `string`
- Default: `Date.now()` at generation time
- Description: Query string appended to font `url(...)` values in built-in templates (before optional `&v=` hash). Use a fixed value (for example `v=1`) when you only need manual cache busting; pair with [`addHashInFontUrl`](#addhashinfonturl) for automatic content-based busting.

## addHashInFontUrl

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
import { webfont } from "webfont";

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

## unicodeRange

- Type: `boolean | string`
- Default: `false` (omit `unicode-range` from built-in templates)
- Description: When `true` and a built-in `template` is used, emit a `unicode-range` declaration in `@font-face` so the browser can load only the icon font that owns the code points on the page. With the default `startUnicode` (`0xEA01`), the range is derived from the minimum and maximum allocated code points (for example `U+EA01-EA03`). Pass a CSS value string (for example `U+EA01-EAFF`) to override the computed range. Set to `false` to omit the rule (default).
- CLI: `--unicode-range` to enable auto-computed range
- Helps when **multiple icon fonts** share a page ([#322](https://github.com/itgalaxy/webfont/issues/322)) — each `@font-face` can declare which private-use code points it owns so the browser skips downloading fonts that cannot render the glyphs in use.
- **Ligature trade-off:** computed `unicode-range` covers **private-use code points only** (ligature names are ignored when building the range). If you type icon names with OpenType ligatures (`font-feature-settings: "liga"`), a PUA-only `unicode-range` prevents the browser from applying the icon font to ASCII letters, so ligatures **do not render**. Prefer class + codepoint icons in production when `unicode-range` is enabled, or leave `unicodeRange` at the default `false` if you rely on ligature names.

## ligatures

- Type: `boolean`
- Default: `false` (ligature glyphs are **not** added unless you opt in)
- Description: When `true`, each glyph gets a second unicode entry: the icon name with hyphens replaced by underscores (for example `phone-call` → `phone_call`). Browsers can map that character sequence to the icon glyph when OpenType ligatures are enabled (`font-feature-settings: "liga"`).
- CLI: `--ligatures` to enable ligature glyphs in the font.
- **Why off by default:** large icon sets (thousands of glyphs) produce huge GSUB tables. **Firefox on Windows** (DirectWrite) can hang or slow dramatically when ligatures are enabled ([#558](https://github.com/itgalaxy/webfont/issues/558)). Prefer **class + private-use codepoint** CSS for MDI-scale fonts. webfont prints a warning when glyph count exceeds 2000 with ligatures enabled.

## templateFontLigatures

- Type: `boolean`
- Default: `true`
- Description: When `true` and the built-in **`html`** preview template is used, the generated CSS enables `font-feature-settings: "liga"` on the **Ligature** section (`#icon-ligatures`) so ligature names render as icons instead of invisible/missing glyphs. If you also enable [`unicodeRange`](#unicoderange), the HTML template **omits** `unicode-range` on `@font-face` while ligature preview is on (ligature strings are ASCII; a PUA-only `unicode-range` would block the icon font for those characters). Set to `false` if you inject your own ligature CSS.
- CLI: `--no-template-font-ligatures` to omit the CSS rule.
- Requires [`ligatures`](#ligatures) enabled (`--ligatures` / `ligatures: true`). Class-based icons (`.font-name-icon::before` with a private-use codepoint) work without this option.

## glyphTransformFn

- Type: `function`
- Default: `null`
- Description: If you want to transform glyph metadata (e.g. titles of CSS classes or unicode) before transferring it in your style template for your icons, you can use this option with glyphs metadata object.
- Example:

  ```js
  import { webfont } from "webfont";

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

## glyphContentTransformFn

- Type: `function`
- Default: `null`
- Description: Transform each SVG glyph **before** font generation (SVG pipeline only). Use this hook to preprocess SVGs — for example stroke-based icons converted to filled paths. **webfont does not bundle preprocessors**; install tools such as [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke) in **your** project and call them from this function (see [ADR 0011](../../../docs/adr/0011-no-svg-outline-stroke-dependency.md)). `glyphTransformFn` only changes metadata; this hook receives the full `GlyphData` (`contents`, `srcPath`, optional `metadata`) and must return the new SVG string.
- Example (stroke icons, #144 — **install `svg-outline-stroke` in your app**, not in webfont):

  ```js
  import outlineStroke from "svg-outline-stroke";
  import { webfont } from "webfont";

  await webfont({
    files: "src/svg-icons/**/*.svg",
    glyphContentTransformFn: async (glyph) => outlineStroke(glyph.contents),
  });
  ```

  For better trace quality with `svg-outline-stroke`, use a larger `width` / `height` / `viewBox` on the source SVG (see the library README).

## optimizeSvg

- Type: `boolean`
- Default: `false`
- Description: When `true`, run a **conservative** [SVGO](https://github.com/svg/svgo) pass on each SVG **after** diagnostics and **before** `glyphContentTransformFn`. Removes editor cruft (comments, metadata, doctype) without rewriting paths or removing `viewBox`. Does **not** convert stroke-only artwork to fills — pair with [`glyphContentTransformFn`](#glyphcontenttransformfn) for stroke icons ([#327](https://github.com/itgalaxy/webfont/issues/327), [#724](https://github.com/itgalaxy/webfont/issues/724)).
- CLI: `--optimize-svg`
- Optional: `svgoConfig` — SVGO `Config` object; when `plugins` is set, it replaces the built-in conservative plugin list.

  ```js
  import { webfont } from "webfont";

  await webfont({
    files: "src/icons/**/*.svg",
    optimizeSvg: true,
    glyphContentTransformFn: async (glyph) => {
      // optional: stroke-to-fill after SVGO cleanup
      return glyph.contents;
    },
  });
  ```

## svgTools (alpha)

- Type: `{ diagnose?: boolean; onMessage?: (message: string) => void }`
- Default: `undefined` (disabled)
- Description: **Alpha.** Scan SVG sources for icon-font incompatibilities before font generation (SVG pipeline only). Does **not** modify SVGs — use [`glyphContentTransformFn`](#glyphcontenttransformfn) to preprocess (for example stroke-to-fill with [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke), installed in your project). See [ADR 0011](../../../docs/adr/0011-no-svg-outline-stroke-dependency.md).
  - **`diagnose`:** log warnings for `fill-rule: evenodd`, stroke-only paths (`fill="none"` + `stroke`), `<use>` symbol references ([#612](https://github.com/itgalaxy/webfont/issues/612)), and poorly supported elements (`<line>`, `<polyline>`, `<clipPath>`). Results are also returned on `result.svgDiagnostics` when enabled.
  - **`onMessage`:** optional sink for diagnostic log lines (tests, custom UIs).
- CLI: `--svg-diagnose` (alpha).
- Example:

  ```js
  import { webfont } from "webfont";

  const result = await webfont({
    files: "src/icons/**/*.svg",
    svgTools: { diagnose: true },
  });

  console.log(result.svgDiagnostics);
  ```

  See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) — “Icon details missing after export”.

## ttfPostProcess

- Type: `function`
- Default: `undefined`
- Description: Post-process the generated **TTF** buffer **after** it is built and **before** webfont derives WOFF/WOFF2/EOT from it (SVG pipeline only). The callback receives `(ttf, { fontName, formats })` and returns the new font bytes (`Buffer` or `Uint8Array`, sync or async). Every derived format is produced from the returned buffer. This is a **caller-owned** extension point — webfont bundles nothing here, so optional/native steps such as **autohinting** (`ttfautohint`) live in **your** project or a separate package, keeping the core free of native dependencies (same philosophy as [`glyphContentTransformFn`](#glyphcontenttransformfn) and [ADR 0011](../../../docs/adr/0011-no-svg-outline-stroke-dependency.md); see [#749](https://github.com/itgalaxy/webfont/issues/749)).
- Example (autohinting — **install the hinting tool in your app**, not in webfont):

  ```js
  import { webfont } from "webfont";
  import { autohint } from "some-ttfautohint-wrapper";

  await webfont({
    files: "src/svg-icons/**/*.svg",
    formats: ["ttf", "woff2"],
    ttfPostProcess: async (ttf) => autohint(ttf),
  });
  ```

## metadataProvider

- Type: `function`
- Default: built-in metadata service (reads icon names and unicode from SVG files)
- Description: Custom callback to resolve glyph metadata for each source file. Receives the file path and a Node-style callback `(error, metadata)` where `metadata` is `{ name: string, unicode?: string | string[] }`. When omitted, webfont uses its default metadata reader.

  ```js
  import { webfont } from "webfont";

  webfont({
    files: "src/svg-icons/**/*.svg",
    metadataProvider: (srcPath, callback) => {
      callback(null, { name: "custom-icon-name" });
    },
  });
  ```

## sort

- Type: `bool`
- Default: `true`
- Description: Whether you want to sort the icons sorted by name.

## svgicons2svgfont

These options are passed directly to [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) as top-level `webfont()` fields (same names as CLI flags).

## fontName

- Type: `string`
- Default: Taken from the [fontName](#fontname)
- Description: The font family name you want.

## fontId

- Type: `string`
- Default: The `fontName` value
- Description: The font id you want.

## fontStyle

- Type: `string`
- Default: `''`
- Description: The font style you want.

## fontWeight

- Type: `string`
- Default: `''`
- Description: The font weight you want.

## fixedWidth

- Type: `boolean`
- Default: `false`
- Description: Creates a monospace font of the width of the largest input icon.

## centerHorizontally

- Type: `boolean`
- Default: `false`
- Description: Calculate the bounds of a glyph and center it horizontally.

## centerVertically

- Type: `boolean`
- Default: `false`
- Description: Center the glyphs vertically in the generated font.

## normalize

- Type: `boolean`
- Default: `false`
- Description: Normalize icons by scaling them to the height of the highest icon.

## fontHeight

- Type: `number`
- Default: `MAX(icons.height)`
- Description: The outputted font height (defaults to the height of the highest input icon).

## round

- Type: `number`
- Default: `10e12` Setup SVG path rounding.

## descent

- Type: `number`
- Default: `0`
- Description: The font descent. It is useful to fix the font baseline yourself.
- Warning: The descent is a positive value!.

## ascent

- Type: `number`
- Default: `fontHeight - descent`
- Description: The font ascent. Use this options only if you know what you're doing. A suitable value for this is computed for you.

## metadata

- Type: `string`
- Default: `undefined`
- Description: The font [metadata](http://www.w3.org/TR/SVG/metadata.html).
  You can set any character data in, but this is the recommended place for a copyright mention.

## Are you a contributor?

Update this file in the same PR when `webfont()` options, defaults, accepted values, or svgicons2svgfont forwarding change. See [CONTRIBUTING.md](../../CONTRIBUTING.md).

