# Migration guide

What changed between webfont releases and how to update your setup.

See also [CHANGELOG.md](./CHANGELOG.md) for the full release history.

## Entry structure

Every migration entry **must** use these headings in order (omit only when a section truly does not apply — see below):

| Section | Required? | Content |
|---------|-----------|---------|
| **Minimum version** | Yes | Semver when shipped; *pending* before release |
| **What changed** | Yes | One short summary |
| **Before** | Yes | Behavior on older releases |
| **After** | Yes | Behavior on the fixed release |
| **Workaround on older versions** | **Yes when applicable** | Concrete steps users on an older npm version can take **without upgrading** (config shape, CLI flags, external tools, pinned version). **Do not skip** for bug fixes — if the bug is CLI-only, document a config/API path that still works. |
| **After upgrading** | Yes | `npm install webfont@…` and the new recommended command or config |

When no practical workaround exists (rare), keep the heading and write **None** with one sentence explaining why (for example the old release cannot perform the operation at all).

**Example workaround patterns**

- Bug on CLI flag → use cosmiconfig with a **typed** value (number in JSON/JS config instead of a string from argv).
- Missing feature → external tool or script until upgrade.
- Config vs CLI conflict → pass input only on the command line on older releases.

Link the GitHub issue in the entry title. On release: set **Minimum version**, move the entry under that release heading, and trim workarounds that only applied to pre-release builds.

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

Use external encoders until upgrade:

```shell
# Example with npx (adjust paths)
npx ttf2woff path/to/font.ttf > path/to/font.woff
```

Or decompress an existing `.woff2` if you only need the SFNT inside (see WOFF/WOFF2 decompression in README).

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

### Workaround on older versions

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

### Workaround on older versions

On **12.0.0 and earlier**, pass globs on the command line; omit `files` from the config:

```shell
webfont "src/icons/a.svg" "src/icons/b.svg" --config webfont.config.json -d dist/icons
```

### After upgrading

```shell
npm install webfont@12.0.1
webfont --config webfont.config.json -d dist/icons
```
