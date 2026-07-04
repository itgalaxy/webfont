# Getting Started

`webfont` generates fonts from SVG icons, and also **encodes** an existing TTF to
web formats and **decompresses** WOFF/WOFF2 containers back to the TTF/OTF inside.
It is pure JavaScript — no Java or FontForge toolchain required.

> Node.js **build-time** tool. Do not import it from browser/React client bundles.
> Requires Node.js **>= 24.14.0**.

## Installation

```shell
npm install --save-dev webfont
```

## Usage (Node API)

Use the **named export** (required for native ESM, recommended since webfont 10+):

```js
import { webfont } from "webfont";

const result = await webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font",
  formats: ["woff2", "woff"],
});

// result.woff2, result.woff, result.css, …
```

CommonJS:

```js
const { webfont } = require("webfont");
```

## Input modes

`webfont` runs one of three pipelines depending on the matched input files. They
cannot be mixed in a single run.

| Mode | Input | Outputs |
|------|-------|---------|
| **SVG icons** (default) | `.svg` files | `svg`, `ttf`, `eot`, `woff`, `woff2` |
| **TTF encoding** | `.ttf` files | `ttf`, `svg` (SVG font), `eot`, `woff`, `woff2` |
| **Webfont decompress** | `.woff` / `.woff2` files or URLs | `ttf` and/or `otf` (embedded flavor) |

### TTF encoding

```js
// TTF → WOFF + WOFF2 (default when formats are unset)
await webfont({ files: "path/to/font.ttf" });

// TTF → SVG font (opt-in; pure JS via fonteditor-core)
const { svg } = await webfont({ files: "path/to/font.ttf", formats: ["svg"] });
```

### Webfont decompress

```js
// Decompress WOFF2 back to the embedded TTF
await webfont({ files: "path/to/font.woff2", formats: ["ttf"] });
```

## Usage (CLI)

```shell
# SVG icons → woff2 + woff into ./dist
webfont "src/svg-icons/*.svg" -f woff2,woff -d dist --dest-create

# TTF → multiple web formats
webfont "fonts/*.ttf" -f woff2,woff,eot,svg -d dist --dest-create
```

Run `webfont --help` for the full flag list.

## Autohinting

`webfont` does not bundle a hinting engine (`ttfautohint` is a native binary).
Run it yourself through the [`ttfPostProcess`](https://github.com/itgalaxy/webfont#ttfpostprocess)
hook, which receives the generated **TTF before** WOFF/WOFF2/EOT are derived:

```js
import { webfont } from "webfont";
import TTFAutohint from "ttfautohint";

await webfont({
  files: "src/svg-icons/**/*.svg",
  formats: ["ttf", "woff", "woff2", "eot"],
  ttfPostProcess: (ttf) => TTFAutohint.transform(ttf, { icon: true }),
});
```

## Learn more

- [Full README & options](https://github.com/itgalaxy/webfont#readme)
- [FEATURES.md](https://github.com/itgalaxy/webfont/blob/master/FEATURES.md) — capability list
- [TROUBLESHOOTING.md](https://github.com/itgalaxy/webfont/blob/master/TROUBLESHOOTING.md)
- [MIGRATION.md](https://github.com/itgalaxy/webfont/blob/master/MIGRATION.md)
