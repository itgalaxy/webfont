# Large icon fonts and browser slowdown ([#558](https://github.com/itgalaxy/webfont/issues/558))

**Minimum version:** *pending* (runtime warning); workaround works on all releases with `--no-ligatures`

## What changed

webfont **10+** enables **ligatures by default**. For icon sets with **thousands** of glyphs, the generated font’s ligature tables can make browsers — especially **Firefox on Windows** — hang or slow dramatically during layout.

A future release prints a **warning** when glyph count exceeds **2000** with ligatures enabled.

## Before

Material Design Icons and similar toolchains on **webfont 9.x** (ligatures off or absent) produced WOFF2 files that loaded quickly in Firefox on Windows.

## After

**webfont 11+** with default `ligatures: true` on ~5k–7k icons produces fonts that trigger expensive DirectWrite ligature processing ([#558](https://github.com/itgalaxy/webfont/issues/558), [MaterialDesign#6519](https://github.com/Templarian/MaterialDesign/issues/6519)).

## Workaround on older versions

On **any** webfont version that supports `--no-ligatures` / `ligatures: false`:

```shell
webfont "svg/**/*.svg" -d dist --no-ligatures -f woff2
```

```js
import { webfont } from "webfont";

await webfont({
  files: "svg/**/*.svg",
  ligatures: false,
  formats: ["woff2"],
});
```

Use **class + private-use codepoint** CSS in your app; do not type icon names with `font-feature-settings: "liga"` for large sets.

## After upgrading

Keep `ligatures: false` in `webfont.config.js` / CI for large icon fonts. See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) — “Browser hangs or extreme slowdown”.
