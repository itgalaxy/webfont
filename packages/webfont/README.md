# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![pkg.pr.new](https://pkg.pr.new/badge/itgalaxy/webfont)](https://pkg.pr.new/~/itgalaxy/webfont)

Generator of fonts from SVG icons; decompress WOFF/WOFF2 to embedded TTF/OTF (not TTF↔OTF transcoding).

Requires **Node.js** >= 24.14.0. Use at **build time** only — do not import from browser or React client bundles ([#198](https://github.com/itgalaxy/webfont/issues/198)).

## Install

```shell
npm install --save-dev webfont
```

Add a CLI script (optional):

```json
{
  "scripts": {
    "icons": "webfont 'src/icons/*.svg' -d dist/fonts -t css"
  }
}
```

Full setup (cosmiconfig, verification, first run): **[install.md](./install.md)** · [webfont.js.org/introduction/install](https://webfont.js.org/introduction/install)

## Usage

Use the **named export** (recommended for ESM and CommonJS):

```js
import { webfont } from "webfont";

const result = await webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
});
```

CommonJS:

```js
const { webfont } = require("webfont");
```

`import webfont from "webfont"` works on **12.x+** (default export is the function). On older releases use the named import — see [migration notes](https://webfont.js.org/migrating/issue-0618-esm-default-import).

## Pipelines

Each run uses **one** mode (inputs cannot be mixed):

- **SVG icons** (default) — `.svg` → `svg`, `ttf`, `eot`, `woff`, `woff2`
- **TTF encoding** — `.ttf` → `woff`, `woff2`, and optional `svg` / `eot` (auto-detected)
- **Webfont decompress** — `.woff` / `.woff2` (paths, globs, or URLs) → `ttf` and/or `otf` per file

Details and limits: [webfont.js.org/introduction/getting-started](https://webfont.js.org/introduction/getting-started) · [Features](https://webfont.js.org/introduction/features)

## Documentation (shipped with this package)

| Guide | File |
|-------|------|
| Install & CLI wiring | [install.md](./install.md) |
| `webfont()` options & svgicons2svgfont | [docs/configuration.md](./docs/configuration.md) |
| CLI flags & exit codes | [docs/cli.md](./docs/cli.md) |
| Font licensing & legal notices | [NOTICE.md](./NOTICE.md) |

## More documentation

- **Site:** [webfont.js.org](https://webfont.js.org)
- **Repository:** [github.com/itgalaxy/webfont](https://github.com/itgalaxy/webfont)
- **Troubleshooting:** [webfont.js.org/introduction/troubleshooting](https://webfont.js.org/introduction/troubleshooting)
- **Migration:** [webfont.js.org/migrating/](https://webfont.js.org/migrating/)
- **Issues:** [github.com/itgalaxy/webfont/issues](https://github.com/itgalaxy/webfont/issues)
- **Changelog:** [webfont.js.org/introduction/whats-new](https://webfont.js.org/introduction/whats-new) · [GitHub](https://github.com/itgalaxy/webfont/blob/master/packages/webfont/CHANGELOG.md)

## License

The **webfont software** is licensed under the [MIT License](./LICENSE). That license does **not** apply to fonts or icons you process with the tool — see [NOTICE.md](./NOTICE.md).
