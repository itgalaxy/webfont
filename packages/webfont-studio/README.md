# webfont-studio

Browser studio for [webfont](../webfont) — upload SVG icons, map glyphs, and download generated fonts (TTF, WOFF, WOFF2, SVG font) in the browser via Web Workers.

Shipped on the docs site at **[webfont.js.org/demo](https://webfont.js.org/demo/)** (built into `public/demo/`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev -w webfont-studio` | Dev server at http://localhost:3333/demo/ |
| `npm run build -w webfont-studio` | Production bundle → `public/demo/` |
| `npm run test -w webfont-studio` | Unit tests |

From the repo root: `npm run studio:dev`, `npm run studio:build`.

## svgTools (alpha)

Optional SVG diagnostics and `outline-stroke` fix use Potrace WASM ([`esm-potrace-wasm`](https://github.com/tomayac/esm-potrace-wasm), GPL-2.0) in the worker. Node.js builds use [`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke) instead.

## Styling

UI tokens align with the VitePress default theme (`--vp-c-*` palette) used on [webfont.js.org](https://webfont.js.org).
