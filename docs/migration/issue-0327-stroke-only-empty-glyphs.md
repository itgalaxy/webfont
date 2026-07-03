# Empty glyph paths for stroke-only SVGs ([#327](https://github.com/itgalaxy/webfont/issues/327))

**Minimum version:** *pending*

## What changed

After SVG font generation, webfont checks that each `<glyph>` in the SVG font output has non-empty path data (`d`). **Stroke-only** sources that previously produced a font file with **blank** glyphs now **fail** with an explicit error and TROUBLESHOOTING guidance.

## Before

`webfont icons/wave.svg` could exit `0` while the WOFF/WOFF2 glyph path was empty (`d=""`). Icons did not render in the browser with no clear error.

## After

The run fails before writing outputs:

```text
Empty glyph path(s) in SVG font output for: wave (icons/wave.svg). Stroke-only SVGs (fill="none" with stroke) often produce empty glyphs ...
```

Use `--svg-diagnose` or `svgTools: { diagnose: true }` for compatibility warnings; preprocess strokes with `glyphContentTransformFn` or convert to fills in your design tool.

## Workaround on older versions

On releases before the fix:

1. **Inspect the SVG font** (enable `formats: ["svg"]`) and search for `d=""` on `<glyph>` elements.
2. **Convert strokes to filled paths** before running webfont (design tool or `glyphContentTransformFn` with svg-outline-stroke / svg-fixer).
3. Run with **`--svg-diagnose`** to flag stroke-only sources early (does not fix them).

## After upgrading

```shell
npm install webfont@<version>
webfont "icons/*.svg" --svg-diagnose -d dist/icons
```

Fix stroke-only sources, then regenerate:

```js
import { webfont } from "webfont";
import outlineStroke from "svg-outline-stroke";

await webfont({
  files: "icons/**/*.svg",
  glyphContentTransformFn: async (glyph) => outlineStroke(glyph.contents),
});
```

See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) — “Stroke-only SVGs produce blank icons”.
