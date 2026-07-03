# Troubleshooting

Common CLI issues and how to fix them. Each entry follows the same structure: the error you see, why it happens, and steps to resolve it.

---

## Destination directory does not exist

### What error appeared

The CLI exits with code **1** and prints a message similar to:

```text
Error: Destination directory "path/to/your/fonts" does not exist. Use --dest-create (-m) to create it.
```

You may also see progress output before the error when `--verbose` is enabled, for example:

```text
Generating SVG font...
Error: Destination directory "path/to/your/fonts" does not exist. Use --dest-create (-m) to create it.
```

On older versions, the same situation could surface as a raw filesystem error instead:

```text
Error: ENOENT: no such file or directory, open 'path/to/your/fonts/webfont.woff2'
```

In those cases the process could still exit with code **0** even though no font files were written.

### Why it usually happens

- **`--dest` / `-d` points to a folder that was never created.** Webfont does not create the output directory unless you ask it to.
- **The path is relative to your current working directory.** A path that looks correct in your editor may not exist from the shell directory where you run the command.
- **A build script or CI job runs before `mkdir`.** Scripts often assume `dist/fonts` or `public/icons` already exist.
- **A typo in the path** (extra segment, wrong casing on case-sensitive filesystems, or a missing parent directory).

Font generation can finish before files are written. If the destination folder is missing, the write step fails even though earlier steps (and verbose logs) may have already run.

### Steps to try to resolve

1. **Confirm the path exists from the same directory where you run webfont.**

   ```shell
   ls -la path/to/your/fonts
   ```

   If the directory is missing, either create it yourself or use step 2.

2. **Ask webfont to create the destination directory.**

   ```shell
   webfont "src/icons/*.svg" -d path/to/your/fonts --dest-create
   ```

   Short form:

   ```shell
   webfont "src/icons/*.svg" -d path/to/your/fonts -m
   ```

3. **Create the directory manually** (useful in CI or when you want explicit control):

   ```shell
   mkdir -p path/to/your/fonts
   webfont "src/icons/*.svg" -d path/to/your/fonts
   ```

4. **Use an absolute path for `--dest`** if your script changes working directories:

   ```shell
   webfont "src/icons/*.svg" -d "$(pwd)/dist/fonts"
   ```

5. **Check write permissions** on the parent directory if creation still fails:

   ```shell
   mkdir -p path/to/your/fonts
   touch path/to/your/fonts/.write-test && rm path/to/your/fonts/.write-test
   ```

6. **When using the programmatic API**, set `destCreate: true` if the folder may not exist yet:

   ```js
   import webfont from "webfont";

   await webfont({
     files: "src/icons/*.svg",
     dest: "dist/fonts",
     destCreate: true,
   });
   ```

7. **Upgrade webfont** if you see exit code **0** with no output files and only an `ENOENT` message. Current releases fail with exit code **1** and the clearer destination error above.

If the problem persists, open an issue with the full command, your working directory, and the complete terminal output.

---

## `npm warn Unknown env config "devdir"`

### What error appeared

Every `npm` command prints a warning similar to:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

The command still succeeds; only the warning is noisy.

### Why it usually happens

- **Cursor (or some IDE sandboxes) inject `npm_config_devdir`** into the shell environment so node-gyp uses a sandbox cache directory.
- **npm 11.2+ warns** because `devdir` is not an official npm config key — it is a legacy node-gyp convention.
- **This repository does not set `devdir`.** The project `.npmrc` only contains `save-exact=true`.

Confirm the source in your terminal:

```shell
echo "$npm_config_devdir"
```

If the path contains `cursor-sandbox-cache` (or similar), the IDE injected it — not webfont.

### Steps to try to resolve

1. **Clear the variable for one command:**

   ```shell
   npm_config_devdir= npm test
   ```

2. **Clear it for the current shell session:**

   ```shell
   unset npm_config_devdir
   ```

3. **Cursor / VS Code integrated terminal** — this repo ships `.vscode/settings.json` with `npm_config_devdir` cleared. Open a **new** terminal or reload the window (*Developer: Reload Window*) so the setting applies. Existing terminals keep the old environment.

4. **CI and plain shells** outside Cursor are unaffected; no change is required there.

This warning does not indicate a broken install or a webfont bug.

---

## Config `files` ignored when using `--config`

### What error appeared

You pass `--config webfont.config.json` with a `files` array in the config, but webfont only processes SVG paths from the command line — or shows help when you omit positional arguments.

Example config:

```json
{
  "files": ["src/icons/a.svg", "src/icons/b.svg"],
  "dest": "dist/icons",
  "fontName": "my-icons"
}
```

**Older releases (before the fix in [#696](https://github.com/itgalaxy/webfont/pull/696)):**

```shell
webfont --config webfont.config.json -d dist/icons
# Shows help or does not pick up both files from config
```

If you also pass SVG paths on the CLI while `files` is set in the config, older releases may silently prefer CLI input only.

**After the fix ships** (upgrade required), combining both causes a clear error:

```text
Error: Cannot specify input files on the command line when `files` is set in the config file
```

### Why it usually happens

- **The CLI treated positional arguments as the only input source.** Config `files` was merged inside `webfont()`, but the CLI required at least one path on the command line before running.
- **`files` in config and CLI input are mutually exclusive by design** — use one or the other to avoid ambiguity about which globs win.

### Steps to try to resolve

1. **Upgrade webfont** to a version that includes the fix for [#2](https://github.com/itgalaxy/webfont/issues/2) (see release notes / [#696](https://github.com/itgalaxy/webfont/pull/696)). Then run **without** positional SVG arguments:

   ```shell
   webfont --config webfont.config.json -d dist/icons
   ```

2. **Until you upgrade**, pass all globs on the command line and use the config only for other options (`fontName`, `dest`, `formats`, etc.):

   ```shell
   webfont "src/icons/a.svg" "src/icons/b.svg" --config webfont.config.json -d dist/icons
   ```

   Ensure the config file does **not** contain a `files` key in this mode.

3. **Programmatic API** — pass `files` directly (config discovery still merges other keys):

   ```js
   import { webfont } from "webfont";

   await webfont({
     files: ["src/icons/a.svg", "src/icons/b.svg"],
     configFile: "webfont.config.json",
   });
   ```

4. **Do not mix** CLI positional paths with `files` in the config after upgrading — pick one source of truth.

If the problem persists after upgrading, open an issue with your config file, full command, and webfont version (`webfont --version` or `npm ls webfont`).

---

## Icon details missing after export

### What error appeared

There is often **no error**. The font builds successfully, but part of the icon is missing in the browser — for example the dot on a letter in a LinkedIn-style logo ([#175](https://github.com/itgalaxy/webfont/issues/175)).

The same SVG looks correct in Inkscape, Illustrator, or Affinity Designer.

### Why it usually happens

- **`fill-rule: evenodd` on compound paths.** Many design tools export icons as one path with multiple subpaths and `fill-rule: evenodd` (often via an inline `style` on the root `<svg>`). Browsers still draw that SVG correctly.
- **Icon fonts use the nonzero fill rule.** When the SVG is converted to a font glyph, `fill-rule` is not preserved. Counter-shapes and holes can disappear or invert — the geometry is often still in the glyph path, but it renders wrong.
- **`--normalize` does not fix fill-rule.** Normalization adjusts metrics and path coordinates; it does not change evenodd semantics ([#80](https://github.com/itgalaxy/webfont/issues/80)).
- **Small viewBoxes can make detail loss worse** for complex paths. Try a larger artboard (for example 512×512) and `fontHeight: 600` with `normalize: true` when paths are very small ([#80](https://github.com/itgalaxy/webfont/issues/80#issuecomment-435621410)).

Run with **`--verbose`** to log a warning when webfont detects `fill-rule: evenodd` in a source SVG.

**Alpha — broader diagnostics:** use **`--svg-diagnose`** (CLI) or `svgTools: { diagnose: true }` (API) to also flag stroke-only SVGs and unsupported elements (`<line>`, `<polyline>`, `<clipPath>`). webfont does not auto-fix these — preprocess with [`glyphContentTransformFn`](./README.md#glyphcontenttransformfn) when needed (see [ADR 0011](docs/adr/0011-no-svg-outline-stroke-dependency.md)).

### Steps to try to resolve

1. **Inspect the SVG with nonzero fill rule.** Temporarily change `fill-rule:evenodd` to `fill-rule:nonzero` in the file and reopen it in a vector editor. Missing pieces usually indicate path direction or compound-path issues, not a silent webfont failure.

2. **Fix the source in your design tool (recommended).**
   - Merge shapes with **Unite** / **Union**, then **Object → Compound Path → Make** (Illustrator: Ctrl/Cmd+8) so holes use correct winding ([#175](https://github.com/itgalaxy/webfont/issues/175#issuecomment-966653174)).
   - Avoid leaving `fill-rule: evenodd` on icons destined for icon fonts.
   - Export at a **larger size** (for example 512×512) when the tool produces fragile small paths.

3. **Tune font metrics for fine detail:**

   ```js
   await webfont({
     files: "src/icons/**/*.svg",
     normalize: true,
     fontHeight: 600,
   });
   ```

4. **Preprocess difficult SVGs** with [`glyphContentTransformFn`](./README.md#glyphcontenttransformfn) (for example retrace or flatten strokes with [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke) or [svg-fixer](https://github.com/oslllo/svg-fixer), installed in your project) before generating the font.

5. **Remove percentage `width` / `height`** on the root `<svg>` if a preprocessor errors; keep a numeric `viewBox` instead.

See also [MDN: fill-rule](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule).

---

## Stroke-only SVGs produce blank icons

### What error appeared

On releases **after** the [#327](https://github.com/itgalaxy/webfont/issues/327) fix, webfont **fails the run** with a message similar to:

```text
Empty glyph path(s) in SVG font output for: wave (icons/wave.svg). Stroke-only SVGs (fill="none" with stroke) often produce empty glyphs because svgicons2svgfont does not convert strokes. ...
```

On **older releases**, the command may exit successfully but the icon is **invisible** in the browser — the font file exists, yet the glyph path is empty (`d=""`).

### Why it usually happens

- The SVG uses **strokes** instead of **filled paths** (`fill="none"` with `stroke`, or `<line>` / `<polyline>` elements).
- **svgicons2svgfont** (the library that merges SVGs into a font) does **not** convert strokes to outlines. Stroke geometry is dropped, so the exported glyph has no path data.
- Design tools and browsers still preview the SVG correctly; only the font export is affected.

### Steps to try to resolve

1. **Convert strokes to fills** in your design tool (Outline Stroke / Expand / Object to Path) before export.

2. **Preprocess in your build** with [`glyphContentTransformFn`](./README.md#glyphcontenttransformfn). webfont **does not ship** stroke converters — install a tool in **your** project (for example [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke) or [svg-fixer](https://github.com/oslllo/svg-fixer)) and call it from the hook (see [ADR 0011](docs/adr/0011-no-svg-outline-stroke-dependency.md)).

3. **Scan sources before converting:** `webfont icons/*.svg --svg-diagnose` (or `svgTools: { diagnose: true }` in the API) logs stroke-only and unsupported-element warnings without changing files.

4. **Optional SVGO cleanup:** `webfont icons/*.svg --optimize-svg` (or `optimizeSvg: true`) removes comments and editor metadata before conversion — it does **not** convert strokes. Use **before** `glyphContentTransformFn` when you need both cleanup and stroke outlining ([#724](https://github.com/itgalaxy/webfont/issues/724)).

5. **Optimize with SVGO** only after strokes are outlines — aggressive SVGO presets alone do not fix stroke-only artwork for icon fonts.

---

## Ligature names show text but no icon (HTML preview)

### What error appeared

There is often **no error**. The built-in **`html`** preview lists icon names under **Ligature**, but the large icon above each name is **blank** or shows **fallback serif text** (for example `bleach`, `drip_dry`) while the **Class** section (`.font-icon-name::before`) shows the glyph.

### Why it usually happens

- **Ligature mode** types the icon name (for example `phone_call`) as normal text. The browser must apply OpenType **`liga`** so that character sequence maps to the icon glyph in the font.
- Icon fonts typically **do not** include regular Latin letters — without `liga`, the browser looks up `p`, `h`, `o`, … in the icon font, finds no glyphs, and renders nothing.
- From webfont **12.x** onward, the built-in `html` template adds `font-feature-settings: "liga" 1` on `#icon-ligatures` by default (`templateFontLigatures`, on by default). Older HTML output or custom templates may omit this rule.
- **`unicode-range` on `@font-face` limits which characters use the icon font.** Auto `unicode-range` (default for `css` / `scss` templates) covers only private-use code points (for example `U+EA01-EA1D`). Ligature names are ASCII (`bleach`, `drip_dry`, …), so the browser keeps a fallback font for those letters and **`liga` never runs**. The built-in `html` template omits `unicode-range` when ligature preview is enabled; production CSS can keep `unicode-range` if you use class + codepoint icons instead of typed names.

### Steps to try to resolve

1. **Regenerate** with a current webfont version (built-in `html` template enables `liga` by default and omits `unicode-range` on `@font-face` for ligature preview).

2. **If ligatures still show as system serif text**, check for `unicode-range` on `@font-face` in your own CSS — it must not exclude ASCII when you type icon names. Use class + codepoint icons in production, or omit / widen `unicode-range` for ligature usage.
3. **In your own CSS or template**, enable ligatures where you type icon names:

   ```css
   .my-icon-font {
     font-family: "my-icon-font";
     font-feature-settings: "liga" 1;
     font-variant-ligatures: common-ligatures;
   }
   ```

4. **Prefer class + codepoint** for production (works without `liga` and with `unicode-range`):

   ```html
   <i class="my-icon-font my-icon-font-phone-call"></i>
   ```

5. **Disable preview CSS** if you manage ligatures yourself: `templateFontLigatures: false` or `--no-template-font-ligatures`.

6. Ensure [`ligatures`](./README.md#ligatures) is not disabled (`--no-ligatures` removes ligature glyphs from the font).

---

## Can't resolve `fs` (webpack / React / Vite client bundle)

### What error appeared

Bundlers fail while building client code with errors such as:

```text
Module not found: Error: Can't resolve 'fs'
```

The stack trace often includes `globby`, `fast-glob`, `cosmiconfig`, or `webfont/dist/standalone.js` ([#198](https://github.com/itgalaxy/webfont/issues/198)).

### Why it usually happens

- **`webfont` is Node.js-only.** It reads SVG files from disk, runs `globby`, and uses other Node built-ins. It is meant for **build time**, not inside browser/React component bundles.
- **The package was imported from client code** (for example `import webfont from "webfont"` in `App.js`). Webpack/Vite tries to bundle the full Node implementation and fails on `fs`.

### Steps to try to resolve

1. **Do not import `webfont` from client-side code.** Generate fonts in an npm script, a Node build step, or CI:

   ```shell
   webfont "src/icons/*.svg" -d public/fonts -t css
   ```

2. **Use the [webfont-webpack-plugin](https://github.com/itgalaxy/webfont-webpack-plugin)** (or an equivalent build hook) so generation runs in Node during compilation — not in the browser bundle.

3. **Programmatic API — Node only:**

   ```js
   import { webfont } from "webfont";

   await webfont({ files: "src/icons/*.svg", dest: "public/fonts" });
   ```

   Run this from a `.mjs` script, `vite.config.ts`, or webpack config — never from React components loaded in the browser.

4. **If a dependency still pulls `webfont` into the client bundle**, mark it external or move the import to a Node-only file. With webpack 5+, the package `browser` field resolves to a stub that throws a clear error instead of pulling in `fs`.

5. **Browser-based generation** is not supported on the current release; see [#708](https://github.com/itgalaxy/webfont/issues/708) for a possible future Web Worker spike.


