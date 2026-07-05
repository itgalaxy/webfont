# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Node.js CI](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml/badge.svg)](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml)

Generator of fonts from SVG icons, with separate modes to **encode** TTF to web formats and **decompress** WOFF/WOFF2 containers to the TTF or OTF inside.

**Documentation site:** [webfont.js.org](https://webfont.js.org) — install, configuration, CLI, demos, and guides.

| Topic | Where |
|-------|--------|
| **Features** (stable / in-progress / planned) | [FEATURES.md](./FEATURES.md) |
| **Install & first run** | [packages/webfont/install.md](./packages/webfont/install.md) · [webfont.js.org/introduction/install](https://webfont.js.org/introduction/install) |
| **API & options** | [packages/webfont/docs/configuration.md](./packages/webfont/docs/configuration.md) · [webfont.js.org/introduction/configuration](https://webfont.js.org/introduction/configuration) |
| **CLI reference** | [packages/webfont/docs/cli.md](./packages/webfont/docs/cli.md) · [webfont.js.org/introduction/cli](https://webfont.js.org/introduction/cli) |
| **Troubleshooting** | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| **Migration** | [MIGRATION.md](./MIGRATION.md) |
| **Legal / licensing** | [packages/webfont/NOTICE.md](./packages/webfont/NOTICE.md) |

## Capabilities at a glance

Quick summary of the three pipelines webfont supports. Each run picks **one** mode from matched inputs — SVG icons, TTF encoding, or WOFF/WOFF2 decompression (they cannot be mixed).

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

Every matched path must end in `.svg`, `.ttf`, `.woff`, or `.woff2`.

**Full capability list** — stability, behavior details, and test-backed criteria: **[FEATURES.md](./FEATURES.md)**.

### Font licensing

webfont is a technical tool. **Decompressing or generating fonts does not grant you any rights to those fonts.** You must have permission to use, convert, and redistribute every input file and every output file under the applicable license. The MIT license applies to **this software only**, not to fonts you pass through it. See **[NOTICE.md](./packages/webfont/NOTICE.md)**.

**Migrating from another tool?** See [MIGRATION.md](./MIGRATION.md#migrating-from-other-tools).

## Quick start

Requires **Node.js** >= 24.14.0. Install as a dev dependency and run at **build time** (not from browser or React client bundles):

```shell
npm install --save-dev webfont
```

```js
import { webfont } from "webfont";

const result = await webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
});
```

**Next steps:** [Install guide](./packages/webfont/install.md) (CLI script, cosmiconfig, verification) · [Configuration reference](./packages/webfont/docs/configuration.md) · [npm package README](./packages/webfont/README.md) (what ships on npm).

Node.js only — do not import from client-side app code ([#198](https://github.com/itgalaxy/webfont/issues/198)).

## Repository layout

This is an **npm workspaces** monorepo. The published package lives in **`packages/webfont`** (`name: "webfont"` on npm). User-facing markdown for the docs site stays at the repo root; package-specific guides ship inside the tarball (`install.md`, `docs/configuration.md`, `docs/cli.md`, `NOTICE.md`, `LICENSE`).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [open issues](https://github.com/itgalaxy/webfont/issues). Pull requests use the [PR template](https://github.com/itgalaxy/webfont/blob/master/.github/pull_request_template.md).

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin)
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) · [svg2ttf](https://github.com/fontello/svg2ttf) · [ttf2eot](https://github.com/fontello/ttf2eot) · [ttf2woff](https://github.com/fontello/ttf2woff) · [wawoff2](https://github.com/fontello/wawoff2)
- [fontTools](https://github.com/fonttools/fonttools) — complementary Python toolkit for subsetting, variable fonts, and table editing after webfont generates the font.

## Changelog

[packages/webfont/CHANGELOG.md](./packages/webfont/CHANGELOG.md)

## License

The **webfont software** is licensed under the [MIT License](./LICENSE). That license does **not** apply to fonts or icons you process with the tool — see [NOTICE.md](./packages/webfont/NOTICE.md). A copy also ships at [packages/webfont/LICENSE](./packages/webfont/LICENSE) inside the npm package.
