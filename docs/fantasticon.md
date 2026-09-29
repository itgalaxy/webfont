# webfont and Fantasticon

[Fantasticon](https://github.com/tancredi/fantasticon) 4.1.0 and webfont 12.7.0 both build one icon font from SVG files with `svgicons2svgfont` and `svg2ttf`. Fantasticon writes a ready-made kit from a single input directory. webfont is a Node library and CLI with three pipelines: SVG icons, TTF encoding, and WOFF/WOFF2 decompression.

This page is the map between them. Behavior that is not in the current webfont release is listed at the end.

## Shared

| Capability | webfont | Fantasticon |
| --- | --- | --- |
| SVG icons → one font | Globs of `.svg` files | One input directory of `.svg` files |
| Formats from SVG | `svg`, `ttf`, `eot`, `woff`, `woff2`. Default is all five. `otf` is rejected on this pipeline | `eot`, `woff2`, `woff`, `ttf`, `svg`. Default is `eot`, `woff2`, `woff` |
| CSS, SCSS, HTML, JSON | Opt-in `template` (`css`, `scss`, `html`, `json`). Several names in one run | `assetTypes`. Default kit is `css`, `html`, `json`, and TypeScript |
| Custom template | Path to a Nunjucks file | Handlebars file per asset type |
| Icon class prefix | `templateClassName` | `prefix` (default `icon`) |
| Font URL inside CSS | `templateFontPath` (default `./`) | `fontsUrl` |
| Cache-busting on font URLs | `templateCacheString` (a timestamp unless you set it). Optional MD5 with `addHashInFontUrl` | MD5 query string on every font URL |
| Font metrics | `normalize`, `fontHeight` (tallest icon), `descent`, `ascent`, `round`, `fixedWidth`, horizontal and vertical centering | `normalize`, `fontHeight` (default `300`), `descent`, `round`. Width and centering are extra SVG-font options |
| Config file | cosmiconfig (`.webfontrc`, `webfont.config.js`, `package.json#webfont`), walking up from the working directory | `.fantasticonrc`, `fantasticonrc`, `.js` or `.json`, in the working directory |
| Programmatic API | `webfont()` returns buffers. `writeResultFiles()` or the CLI writes them | `generateFonts()` writes `outputDir` |
| Node.js | `>= 24.14.0` | `>= 22` in `package.json` `engines` |

## What webfont adds

These run in webfont today. Fantasticon stays on the SVG-icon kit.

| Capability | webfont | Fantasticon |
| --- | --- | --- |
| Encode a `.ttf` to `woff`, `woff2`, `eot`, or an SVG font | Yes. Templates stay off in this mode | No |
| Decompress `.woff` / `.woff2` to the TTF or OTF inside | Yes. Paths, globs, or `http(s)` URLs. One output per input | No |
| Stylus stylesheet | Built-in `styl` template | No |
| OpenType ligatures | Opt-in (`ligatures` / `--ligatures`). Off by default | No |
| `unicode-range` on `@font-face` | Opt-in (`unicodeRange` / `--unicode-range`) | No |
| SVG diagnostics before generation | Alpha (`svgTools.diagnose` / `--svg-diagnose`) | No |
| Conservative SVGO pass | Opt-in (`optimizeSvg`) | No |
| Transform each SVG before the font is built | `glyphContentTransformFn` | No |
| Post-process the TTF before EOT, WOFF, and WOFF2 | `ttfPostProcess` | No |
| Guided CLI and a rerun file | `--assistant`, `--assistant-config` (`.was`) | No |
| Homebrew | `brew install webfont` | No |
| Local MCP server | In this repository, for agents | No |

`otf` from the SVG pipeline is rejected in both tools. webfont emits `otf` only when a WOFF or WOFF2 container holds an OTTO font.

## Migrating

Install webfont as a dev dependency (`npm install --save-dev webfont`) and run it at build time. Node.js must be `>= 24.14.0`.

### Command line

```bash
fantasticon my-icons -o icon-dist -n icons -t ttf woff woff2 -g css json html -p icon -u /static/fonts --normalize --font-height 300
```

```bash
webfont "my-icons/**/*.svg" -d icon-dist --dest-create -u icons -f ttf,woff2,woff -t css,json,html --templateClassName icon --templateFontPath /static/fonts/ --normalize --fontHeight 300
```

Fantasticon's default font formats omit `ttf` and `svg`. Pass `-f` explicitly so webfont does not also emit the SVG font, EOT, and the formats you are not shipping.

### Config

Fantasticon (`.fantasticonrc.js`):

```js
module.exports = {
  inputDir: "./icons",
  outputDir: "./dist",
  name: "icons",
  fontTypes: ["ttf", "woff", "woff2"],
  assetTypes: ["css", "json", "html"],
  fontsUrl: "/static/fonts",
  fontHeight: 300,
  prefix: "icon",
  normalize: true,
};
```

webfont (`webfont.config.js`):

```js
module.exports = {
  files: "icons/**/*.svg",
  fontName: "icons",
  formats: ["ttf", "woff", "woff2"],
  template: ["css", "json", "html"],
  templateFontPath: "/static/fonts/",
  fontHeight: 300,
  templateClassName: "icon",
  normalize: true,
};
```

The CLI still needs an input glob unless `files` is set in that config. `--config` points at a specific file. With no `--config`, webfont searches upward from the working directory.

### Option map

| Fantasticon | webfont |
| --- | --- |
| `inputDir` | `files` — a glob or a list of `.svg` paths |
| `outputDir` | `--dest` / `dest`, then the CLI or `writeResultFiles()` |
| `name` | `fontName` (`-u` / `--fontName`) |
| `fontTypes` | `formats` (`-f` / `--formats`) |
| `assetTypes`: `css`, `scss`, `html`, `json` | `template` (`-t` / `--template`), one name or a list |
| `fontsUrl` | `templateFontPath` |
| `prefix` | `templateClassName` |
| `fontHeight`, `descent`, `normalize`, `round` | Same option names |
| `formatOptions.ttf` | `formatsOptions.ttf` (`copyright`, `description`, `url`, `version`) |
| `formatOptions.json.indent` | The built-in `json` template is already pretty-printed |
| Handlebars `templates.css` | `template` set to a `.njk` path |
| `tag`, `selector` | Custom template for now. See [What's coming](#whats-coming) |
| `codepoints` | `glyphTransformFn`, or filenames `uE000-chevron-left.svg`. See below |
| `getIconId` | `metadataProvider`. See below |
| `pathOptions` | One `dest` directory for every file. See [What's coming](#whats-coming) |
| `assetTypes`: `ts`, `sass` | Not built in yet. `scss` covers SCSS. See [What's coming](#whats-coming) |
| `formatOptions.woff.metadata` | Not forwarded yet. See [What's coming](#whats-coming) |

### Stable code points until the map option exists

Names that must keep a code point can set `unicode` in `glyphTransformFn`. Unlisted icons keep sequential allocation from `startUnicode` (`0xEA01`).

```js
const pinned = {
  "chevron-left": 0xe000,
  "chevron-right": 0xe001,
};

module.exports = {
  files: "icons/**/*.svg",
  fontName: "icons",
  glyphTransformFn: (glyph) => {
    const codePoint = pinned[glyph.name];
    if (codePoint !== undefined) {
      glyph.unicode = [String.fromCodePoint(codePoint)];
    }
    return glyph;
  },
};
```

A single glyph can also take its code point from the filename (`uE000-chevron-left.svg`). That renames the source file.

### Icon ids until path-based names exist

`metadataProvider` replaces the name taken from the basename. Use it when two folders share a filename.

```js
const path = require("node:path");

module.exports = {
  files: "icons/**/*.svg",
  fontName: "icons",
  metadataProvider: (srcPath, callback) => {
    const relativePath = path.relative("icons", srcPath);
    const name = relativePath.replace(/\.svg$/i, "").split(path.sep).join("-");
    callback(null, { name });
  },
};
```

That yields `social-facebook` from `icons/social/facebook.svg`. The default, with no provider, stays the basename (`facebook`).

### Class names

Fantasticon's default selector is `i.icon` plus `i.icon-{id}`. webfont's built-in CSS is `.{templateClassName}-{glyph}::before` and does not emit an element selector. Set `templateClassName: "icon"` for the class stem. A tag or a single custom selector needs a [custom Nunjucks template](../packages/webfont/docs/configuration.md#template) until that option exists.

Generated class names follow the glyph name. If you slug paths in `metadataProvider`, the CSS classes follow those slugs.

## What's coming

Planned. None of this is in the current npm release.

- [TypeScript module of icon ids and code points](https://github.com/itgalaxy/webfont/issues/896)
- [Indented Sass stylesheet](https://github.com/itgalaxy/webfont/issues/897)
- [Declarative code point map](https://github.com/itgalaxy/webfont/issues/898)
- [Glyph ids from relative paths](https://github.com/itgalaxy/webfont/issues/899)
- [A separate output path per generated file](https://github.com/itgalaxy/webfont/issues/900)
- [Base tag and custom CSS selector](https://github.com/itgalaxy/webfont/issues/901)
- [WOFF extended metadata block](https://github.com/itgalaxy/webfont/issues/902)
