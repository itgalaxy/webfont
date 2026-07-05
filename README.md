# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Node.js CI](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml/badge.svg)](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml)

Generator of fonts from SVG icons, with separate modes to **encode** TTF to web formats and **decompress** WOFF/WOFF2 containers to the TTF or OTF inside.

See **[FEATURES.md](./FEATURES.md)** for the canonical capability list (what is stable, in progress, or planned).

**Legal / licensing:** [NOTICE.md](./NOTICE.md) — font copyright, disclaimers, attribution guidelines, and third-party library notices.

**Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common errors on the current release (including [icons that lose detail after export](./TROUBLESHOOTING.md#icon-details-missing-after-export) due to `fill-rule: evenodd`, #175).

**Migration:** [MIGRATION.md](./MIGRATION.md) — what changed between versions and how to upgrade.

## Input modes

webfont runs one of three pipelines depending on matched input files. They cannot be mixed in a single run.

| Mode | Input | Outputs | Notes |
|------|--------|---------|--------|
| **SVG icons** | One or more `.svg` files | `svg`, `ttf`, `eot`, `woff`, `woff2` | Default. Builds TrueType via `svg2ttf`. **`otf` is rejected** — use `ttf`. |
| **TTF encoding** | One or more `.ttf` files | `ttf`, `svg` (SVG font), `eot`, `woff`, and/or `woff2` per input | Auto-detected. Default when SVG-pipeline `formats` are still configured: `woff` + `woff2` (`svg` is opt-in). No templates. |
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

Full details, disclaimers, community attribution guidelines, and third-party library notices: **[NOTICE.md](./packages/webfont/NOTICE.md)**.

**Migrating from another tool?** See [MIGRATION.md](./MIGRATION.md#migrating-from-other-tools) (`webfonts`, `grunt-webfont`, and per-release notes under `docs/migration/`).

## Usage

Requires **Node.js** >= 24.14.0. Install as a dev dependency and run at **build time** (not from browser or React client bundles):

```shell
npm install --save-dev webfont
```

**Full setup** (CLI `npm` script, cosmiconfig, verification, first run): **[packages/webfont/install.md](./packages/webfont/install.md)** · [webfont.js.org/introduction/install](https://webfont.js.org/introduction/install)

Node.js only — do not import from client-side app code ([#198](https://github.com/itgalaxy/webfont/issues/198)).

### Import (ESM and CommonJS)

Use the **named export** — required for native ESM and recommended since webfont **10+**:

```js
import { webfont } from "webfont";
```

CommonJS:

```js
const { webfont } = require("webfont");
```

`import webfont from "webfont"` is callable in versions that ship the ESM build (**12.x+**), where the default export is the `webfont` function itself ([#618](https://github.com/itgalaxy/webfont/issues/618)). On older releases the default import resolved to the whole `module.exports` object and threw `TypeError: webfont is not a function` under `"type": "module"`. The named import remains the recommended form for new code. See the [migration notes](./docs/migration/issue-0618-esm-default-import.md).

### Basic example

```js
import { webfont } from "webfont";

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
const { webfont } = require("webfont");

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
import { webfont } from "webfont";

// Single local TTF → WOFF + WOFF2 (default when formats unset)
const encoded = await webfont({
  files: "path/to/font.ttf",
});

// Explicit formats
const subset = await webfont({
  files: "path/to/font.ttf",
  formats: ["woff2"],
});

// TTF → SVG font (legacy format; opt-in, pure JS via fonteditor-core)
const svgFont = await webfont({
  files: "path/to/font.ttf",
  formats: ["svg"],
});
// svgFont.svg → SVG font as a string

// Batch: multiple TTF files in one run
const batch = await webfont({
  files: ["fonts/Inter-Regular.ttf", "fonts/Inter-Bold.ttf"],
  formats: ["woff", "woff2"],
});
// batch.transcodedFonts → [{ source, woff, woff2 }, …]
```

### Webfont decompress examples

```js
import { webfont } from "webfont";

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

### Autohinting

webfont does not bundle a hinting engine — [`ttfautohint`](https://www.freetype.org/ttfautohint/) is a native binary, so it stays out of the core install. Run it yourself through the [`ttfPostProcess`](./packages/webfont/docs/configuration.md#ttfpostprocess) hook: it receives the generated **TTF before** WOFF/WOFF2/EOT are derived, so the hinted outlines flow into every format.

**Option A — npm wrapper (no system install).** The [`ttfautohint`](https://www.npmjs.com/package/ttfautohint) package ships a prebuilt binary and a Buffer API:

```bash
npm i -D ttfautohint
```

```js
import { webfont } from "webfont";
import TTFAutohint from "ttfautohint";

await webfont({
  files: "src/svg-icons/**/*.svg",
  formats: ["ttf", "woff", "woff2", "eot"],
  // `icon: true` applies icon-font-tuned hinting metrics
  ttfPostProcess: (ttf) => TTFAutohint.transform(ttf, { icon: true }),
});
```

`TTFAutohint.transform(buffer, options)` returns the hinted `Buffer`, which webfont uses as the TTF and as the source for the other formats.

**Option B — system binary (no extra npm dependency).** If `ttfautohint` is already installed (Homebrew, apt, …), pipe the buffer through it:

```js
import { execFileSync } from "node:child_process";
import { webfont } from "webfont";

const autohint = (ttf) =>
  execFileSync("ttfautohint", ["-W", "-i", "-s", "-x", "24", "-l", "12", "-r", "48"], {
    input: ttf,
    maxBuffer: 64 * 1024 * 1024,
  });

await webfont({
  files: "src/svg-icons/**/*.svg",
  formats: ["ttf", "woff2"],
  ttfPostProcess: (ttf) => autohint(ttf),
});
```

**CLI.** Flags can't carry a function, but webfont loads a JS config via cosmiconfig — put the hook in `webfont.config.js`:

```js
// webfont.config.js
const TTFAutohint = require("ttfautohint");

module.exports = {
  files: "src/svg-icons/**/*.svg",
  formats: ["ttf", "woff2"],
  ttfPostProcess: (ttf) => TTFAutohint.transform(ttf, { icon: true }),
};
```

then run `webfont`.

Notes:

- The hook is **opt-in**; webfont core stays free of native dependencies.
- CI must have the binary available — the npm wrapper installs one; the system-binary option requires `ttfautohint` on `PATH`.
- The callback may be async: return a `Promise<Buffer | Uint8Array>` if your tool is asynchronous.
- See [#749](https://github.com/itgalaxy/webfont/issues/749) for autohinting tracking and a possible first-party companion package.

All `webfont()` options and svgicons2svgfont parameters: **[packages/webfont/docs/configuration.md](./packages/webfont/docs/configuration.md)** — also [webfont.js.org/introduction/configuration](https://webfont.js.org/introduction/configuration).

### Result

`webfont()` resolves to an object with generated font buffers (and optional `template` output). The `config` property contains the **effective options** used for the run (defaults, discovered config, and any options you passed in), plus optional **output metadata** when a configuration file was found or loaded.

#### TypeScript

`Result` and `ResultConfig` are exported from the package entry, so you can annotate `webfont()` output directly instead of relying on `ReturnType` inference:

```ts
import { webfont, type Result, type ResultConfig } from "webfont";

const result: Result = await webfont({
  files: "src/svg-icons/**/*.svg",
});

const config: ResultConfig | undefined = result.config;

if (config?.filePath) {
  console.log(`Loaded config from ${config.filePath}`);
}
```

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

## Command Line Interface

Installation, the full flag reference (`--help` output), and exit codes live in [docs/cli.md](./docs/cli.md) — also published at [webfont.js.org/introduction/cli](https://webfont.js.org/introduction/cli).

---

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) - `webpack` plugin.
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) - Simple tool to merge multiple icons to an SVG font.
- [svg2ttf](https://github.com/fontello/svg2ttf) - Converts SVG fonts to TTF format.
- [ttf2eot](https://github.com/fontello/ttf2eot) - Converts TTF fonts to EOT format.
- [ttf2woff](https://github.com/fontello/ttf2woff) - Converts TTF fonts to WOFF format.
- [wawoff2](https://github.com/fontello/wawoff2) - Converts TTF fonts to WOFF2 and versa vice.
- [fontTools](https://github.com/fonttools/fonttools) - Complementary low-level font toolkit (Python) for jobs webfont does not cover: subsetting, variable fonts, OpenType feature compilation, table editing, and TTX (font ⇄ XML). Generate the font with webfont, then inspect or optimize it with fontTools.

## Roadmap

- Arbitrary format transcoding (e.g. TTF ↔ OTF outline conversion) — see [FEATURES.md](./FEATURES.md) (“Arbitrary format transcoding”, planned);
- Reduce package size (maybe implement `ttf2woff2` with a native JS library);
- Improve performance (maybe use cache for this).

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## Changelog

Check our [Changelog](./packages/webfont/CHANGELOG.md)

## Legal Notices

Copyright, disclaimers, font licensing expectations (including WOFF/WOFF2 decompression), community attribution guidelines, and third-party open-source dependencies are documented in **[NOTICE.md](./packages/webfont/NOTICE.md)**.

## License

The **webfont software** is licensed under the [MIT License](./LICENSE). That license does **not** apply to fonts or icons you process with the tool — see [NOTICE.md](./packages/webfont/NOTICE.md).
