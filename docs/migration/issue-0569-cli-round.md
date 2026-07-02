# CLI `--round` numeric strings ([#569](https://github.com/itgalaxy/webfont/issues/569))

**Minimum version:** *pending*

## What changed

`--round` and `round` in config/API still accept **number or string** (no breaking change). Numeric strings (for example `"4"` from the CLI) are coerced to **finite** numbers before `svgicons2svgfont` runs. Empty, whitespace-only, non-numeric, and non-finite values are ignored (library default rounding applies).

## Before (bug)

`webfont icons/*.svg --round 4` could throw:

```text
Error: assertNumbers arguments[0] is not a number. string == typeof 4
```

Misconfigured values such as `""` could also coerce to `0` and silently change rounding.

## After (fix)

Same CLI and config shapes work; coercion happens at the SVG pipeline boundary only. Invalid `round` values are treated as unset.

## Workaround on older versions

On releases before the fix, **avoid passing `--round` from the CLI** (meow supplies a string). Use one of:

**Programmatic API** — pass a number:

```js
await webfont({ files: "icons/*.svg", round: 4 });
```

**Config file** — set `round` as a JSON number (not a string):

```json
{
  "files": "icons/**/*.svg",
  "round": 4
}
```

```shell
webfont --config webfont.config.json -d dist/icons
```

Or omit `round` if the default meets your needs.

## After upgrading

```shell
npm install webfont@<version>
webfont "icons/*.svg" --round 4 -d dist/icons
```

Programmatic usage unchanged:

```js
await webfont({ files: "icons/*.svg", round: 4 });
await webfont({ files: "icons/*.svg", round: "4" });
```
