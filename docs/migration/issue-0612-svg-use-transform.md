# SVG `<use>` and `transform` attributes (#612)

**Minimum version:** 12.1.0 (diagnostic warning); flattening workaround on all versions

## What changed

webfont **does not convert** `<use xlink:href="#…">` references or apply **`transform`** on those instances when building icon fonts. **12.1.0+** adds an **`use-reference`** entry in `--svg-diagnose` / `svgTools.diagnose` output.

## Before

Icons that rely on `<symbol>` + `<use transform="…">` render correctly in browsers but may produce **empty or wrong glyphs** in the generated font ([#612](https://github.com/itgalaxy/webfont/issues/612)).

## After

- **`--svg-diagnose`** / `svgTools: { diagnose: true }` logs a warning when `<use>` is present.
- [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) — “SVG transform and `<use>` references”.

## Workaround on older versions

Flatten icons before webfont:

- Design tool: Expand / Flatten / export without symbol instances.
- Build: run [SVGO](https://github.com/svg/svgo) (or similar) in `glyphContentTransformFn` to inline paths.

```js
import { webfont } from "webfont";

await webfont({
  files: "src/icons/**/*.svg",
  glyphContentTransformFn: async (glyph) => {
    // Your SVGO or flatten step here
    return glyph.contents;
  },
});
```

## After upgrading

```shell
npm install webfont@latest
webfont "icons/*.svg" --svg-diagnose
```

No automatic fix — diagnostics help you find `<use>` before shipping a broken font.
