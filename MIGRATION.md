# Migration guide

What changed between webfont releases and how to update your setup.

See also [packages/webfont/CHANGELOG.md](./packages/webfont/CHANGELOG.md) for the full release history.

## Where entries live

**Each change has its own file** under [`docs/migration/`](./docs/migration/) — not a growing section in this document. That keeps parallel PRs from conflicting on the same markdown file. Browse that folder (files are named `issue-0569-cli-round.md`) for the change that affects you.

**Adding or updating an entry?** See [docs/migration/README.md](./docs/migration/README.md) for naming, the merge-conflict-safe PR workflow, and the required **entry structure**.

## Migrating from other tools

Comparisons with older or adjacent projects live here so [README.md](./README.md) stays focused on installing and using `webfont`.

### Comparison with `webfonts`

`webfont` (this project) is sometimes confused with the older, **unmaintained** [`webfonts`](https://github.com/uipoet/webfonts) package (note the trailing `s`). `webfonts` last shipped around 2015 and requires a **Java** runtime (it bundles `batik-ttf2svg`, `sfnt2woff`, and `ttf2eot`). `webfont` is **pure JavaScript**, actively maintained, and does everything the *useful* parts of `webfonts` did — plus SVG-icon fonts, WOFF2, decompression, templates, and a Node.js API.

| Capability | `webfont` (this project) | `webfonts` ([uipoet/webfonts](https://github.com/uipoet/webfonts)) |
|------------|:------------------------:|:-----------------------------------------------------------------:|
| Maintained | ✅ | ❌ (last release ~2015) |
| Runtime | Pure JS (Node.js) | Node.js **+ Java** |
| SVG icons → font | ✅ (default pipeline) | ❌ |
| TTF input → web formats | ✅ | ✅ |
| Output: `woff2` (Brotli) | ✅ | ❌ |
| Output: `woff` / `eot` | ✅ | ✅ |
| Output: `svg` font | ✅ (`-f svg`, opt-in) | ✅ |
| Choose which formats to emit | ✅ (`-f` / `formats`) | ❌ (always `woff` + `eot` + `svg`) |
| WOFF/WOFF2 → TTF/OTF decompression | ✅ | ❌ |
| Node.js / programmatic API | ✅ (`webfont()`) | ❌ (CLI only) |
| CSS / SCSS / Styl templates | ✅ | ❌ (manual `@font-face` snippet) |
| Config files (cosmiconfig) | ✅ | ❌ |
| `.otf` as a **source** | ❌ ([tracking #767](https://github.com/itgalaxy/webfont/issues/767)) | ❌ ([requested](https://github.com/uipoet/webfonts/issues/4)) |

#### Command-line equivalents

```bash
# webfonts (unmaintained): converts a directory of TTFs, always emits woff + eot + svg
webfonts fonts/ -o dist/

# webfont: pick your formats explicitly (woff2 recommended for the web)
webfont "fonts/*.ttf" -f woff2,woff,eot,svg -d dist --dest-create
```

`webfont` adds `woff2` (much smaller than the legacy formats), lets you emit only what you ship, and needs no Java toolchain.

### Comparison with `grunt-webfont`

[`grunt-webfont`](https://github.com/sapegin/grunt-webfont) is the classic "SVG → webfont" **Grunt plugin** (~1.1k★, MIT). It is **archived** (read-only since 2021, last release `v1.2.0`), and its best-fidelity output relies on a native **FontForge** binary (its pure-`node` engine can't do ligatures). `webfont` is a framework-agnostic, actively maintained, pure-JS library **and** CLI: it does everything grunt-webfont *generated* — plus TTF encoding, WOFF/WOFF2 decompression, more templates, and programmatic hooks. For Grunt, copy the documented [custom task](./packages/webfont/docs/grunt.md) into your project ([#771](https://github.com/itgalaxy/webfont/issues/771), [ADR 0014](./docs/adr/0014-no-grunt-webfont-recipe-workspace.md)).

| Capability | `webfont` (this project) | `grunt-webfont` ([sapegin/grunt-webfont](https://github.com/sapegin/grunt-webfont)) |
|------------|:------------------------:|:----------------------------------------------------------------------------------:|
| Maintained | ✅ | ❌ (archived 2021, `v1.2.0`) |
| Runtime | Node API **+ CLI** (any build tool) | **Grunt task only** |
| Engine | Pure JS (`svg2ttf`) | `node` **or** FontForge binary |
| SVG icons → font | ✅ | ✅ |
| Output formats | `svg, ttf, eot, woff, woff2` | `eot, woff2, woff, ttf, svg` |
| TTF input → web formats | ✅ | ❌ |
| WOFF/WOFF2 → TTF/OTF decompression | ✅ | ❌ |
| Stylesheets | `css, scss, styl, html, json` + custom Nunjucks, multiple per run | `css, sass, scss, less, stylus` + custom |
| CSS syntax presets (BEM / Bootstrap) | ❌ (use a custom template) | ✅ |
| `data:uri` embedding in CSS | ❌ | ✅ (`embed`) |
| Autohinting (`ttfautohint`) | via `ttfPostProcess` hook (external, opt-in) | built-in (`autoHint`) |
| Ligatures | ✅ (opt-in) | ✅ (FontForge engine only) |
| Codepoint map persistence | ❌ | ✅ (`codepointsFile`) |
| Programmatic API | ✅ (`webfont()`) | ❌ (Grunt only) |
| SVG diagnostics | ✅ (alpha) | ❌ |
| Grunt integration | ✅ ([docs](./packages/webfont/docs/grunt.md)) | ✅ (native) |

If you only need the generation that grunt-webfont did, `webfont` is a maintained, FontForge-free replacement. If you specifically need BEM/Bootstrap CSS presets or `data:uri` embedding today, use a [custom template](./packages/webfont/docs/configuration.md#template) in the configuration guide.
