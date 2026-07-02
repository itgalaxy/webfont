# Migration guide

What changed between webfont releases and how to update your setup. Each entry covers **before** / **after**, a **workaround on older versions**, and **steps after upgrading**.

See also [CHANGELOG.md](./CHANGELOG.md) for the full release history.

---

## Next release — TTF to WOFF/WOFF2 encoding ([#13](https://github.com/itgalaxy/webfont/issues/13))

**Minimum version:** *pending*

### What changed

webfont auto-detects **`.ttf` input** (no new flag). One or more TrueType files can be encoded to `eot`, `woff`, and/or `woff2`. Default output when SVG-pipeline `formats` are still configured: `woff` + `woff2`.

### Before

TTF files were rejected (`did not match any supported files`). Users relied on external tools or manual `ttf2woff` / `wawoff2` scripts.

### After

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

### Workaround on older versions

Use `ttf2woff`, `wawoff2`, or FontForge outside webfont, or decompress from an existing WOFF/WOFF2 container if you only need the SFNT inside.

### After upgrading

```shell
npm install webfont@<version>
webfont "fonts/*.ttf" -d dist/webfonts -f woff,woff2 --dest-create
```

---

## Next release — CLI `--round` numeric strings ([#569](https://github.com/itgalaxy/webfont/issues/569))

**Minimum version:** *pending*

### What changed

`--round` and `round` in config/API still accept **number or string** (no breaking change). Numeric strings (for example `"4"` from the CLI) are coerced to numbers before `svgicons2svgfont` runs.

### Before (bug)

`webfont icons/*.svg --round 4` could throw:

```text
Error: assertNumbers arguments[0] is not a number. string == typeof 4
```

### After (fix)

Same CLI and config shapes work; coercion happens at the SVG pipeline boundary only.

### After upgrading

```shell
npm install webfont@<version>
webfont "icons/*.svg" --round 4 -d dist/icons
```

Programmatic usage unchanged:

```js
await webfont({ files: "icons/*.svg", round: 4 });
await webfont({ files: "icons/*.svg", round: "4" });
```

---

## 12.0.1 — CLI `files` from config ([#2](https://github.com/itgalaxy/webfont/issues/2))

**Minimum version:** `12.0.1`

### Before (12.0.0 and earlier)

- The CLI required at least one SVG path as a **positional argument**, even when `files` was set in a config file loaded via `--config`.
- Config-only runs ignored or failed to use config `files`:

  ```shell
  webfont --config webfont.config.json -d dist/icons
  ```

- Passing **both** CLI paths and config `files` was ambiguous; older releases could prefer CLI input only.

### After (12.0.1+)

- **Config-only input:** `webfont --config webfont.config.json -d dist/icons` uses `files` from the config when no positional SVG paths are passed.
- **Mutual exclusion:** CLI positional paths and config `files` cannot be combined — webfont exits with:

  ```text
  Error: Cannot specify input files on the command line when `files` is set in the config file
  ```

### Workaround on 12.0.0

Pass globs on the command line; omit `files` from the config:

```shell
webfont "src/icons/a.svg" "src/icons/b.svg" --config webfont.config.json -d dist/icons
```

### After upgrading to 12.0.1

```shell
npm install webfont@12.0.1
webfont --config webfont.config.json -d dist/icons
```
