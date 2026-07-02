# TTF to WOFF/WOFF2 encoding ([#13](https://github.com/itgalaxy/webfont/issues/13))

**Minimum version:** *pending*

## What changed

webfont auto-detects **`.ttf` input** (no new flag). One or more TrueType files can be encoded to `eot`, `woff`, and/or `woff2`. Default output when SVG-pipeline `formats` are still configured: `woff` + `woff2`.

## Before

TTF files were rejected (`did not match any supported files`). Users relied on external tools or manual `ttf2woff` / `wawoff2` scripts.

## After

```shell
webfont path/to/font.ttf -d dist/fonts -f woff,woff2
```

Programmatic:

```js
const result = await webfont({
  files: "fonts/MyFont.ttf",
  formats: ["woff", "woff2"],
});
// result.woff, result.woff2
```

Batch runs expose `result.transcodedFonts` (`{ source, ttf?, eot?, woff?, woff2? }[]`).

## Workaround on older versions

Use external encoders until upgrade:

```shell
# Example with npx (adjust paths)
npx ttf2woff path/to/font.ttf > path/to/font.woff
```

Or decompress an existing `.woff2` if you only need the SFNT inside (see WOFF/WOFF2 decompression in README).

## After upgrading

```shell
npm install webfont@<version>
webfont "fonts/*.ttf" -d dist/webfonts -f woff,woff2 --dest-create
```
