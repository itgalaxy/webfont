# Large icon fonts and browser performance (#558)

**Minimum version:** warning from *pending* 12.x release; **ligatures off by default** from same release — see [issue-0558-ligatures-default-off.md](./issue-0558-ligatures-default-off.md)

## What changed

webfont can warn when glyph count exceeds **2000** with ligatures **explicitly enabled**. From the next **12.x** release, **ligatures default to `false`** so large icon fonts no longer need `--no-ligatures`.

## Before

- **webfont 10.x–11.x:** ligatures **on by default** for every icon name.
- **Thousands of ligatures** inflate the GSUB table. Windows Firefox uses DirectWrite to process ligature lookups — reflow can take seconds per tab ([#558](https://github.com/itgalaxy/webfont/issues/558), [MaterialDesign#6519](https://github.com/Templarian/MaterialDesign/issues/6519)).
- Material Design Icons on **webfont 9.x** (no ligatures) loaded quickly; **11.x** with default ligatures did not.

## After

- **webfont 12.x:** ligatures **off by default**; opt in with `--ligatures` / `ligatures: true` only when needed.
- Stdout **warning** when `glyphCount > 2000` and ligatures are enabled.

## Workaround on older versions

On **any** webfont version that supports `--no-ligatures` / `ligatures: false`:

```bash
webfont "svg/**/*.svg" -d dist --no-ligatures -f woff2
```

```js
await webfont({
  files: "svg/**/*.svg",
  ligatures: false,
  formats: ["woff2"],
});
```

Keep `ligatures: false` in `webfont.config.js` / CI for MDI-scale fonts.

## After upgrading

```bash
npm install webfont@latest
```

No flag needed for the safe default. If you still enable ligatures on a large set, heed the runtime warning and prefer class + codepoint CSS.

See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) — “Browser hangs or extreme slowdown”.
