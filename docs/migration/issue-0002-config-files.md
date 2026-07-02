# CLI `files` from config ([#2](https://github.com/itgalaxy/webfont/issues/2))

**Minimum version:** `12.0.1`

## What changed

The CLI can load input globs from a config file without positional SVG paths. CLI paths and config `files` are mutually exclusive.

## Before (12.0.0 and earlier)

- The CLI required at least one SVG path as a **positional argument**, even when `files` was set in a config file loaded via `--config`.
- Config-only runs ignored or failed to use config `files`:

  ```shell
  webfont --config webfont.config.json -d dist/icons
  ```

- Passing **both** CLI paths and config `files` was ambiguous; older releases could prefer CLI input only.

## After (12.0.1+)

- **Config-only input:** `webfont --config webfont.config.json -d dist/icons` uses `files` from the config when no positional SVG paths are passed.
- **Mutual exclusion:** CLI positional paths and config `files` cannot be combined — webfont exits with:

  ```text
  Error: Cannot specify input files on the command line when `files` is set in the config file
  ```

## Workaround on older versions

On **12.0.0 and earlier**, pass globs on the command line; omit `files` from the config:

```shell
webfont "src/icons/a.svg" "src/icons/b.svg" --config webfont.config.json -d dist/icons
```

## After upgrading

```shell
npm install webfont@12.0.1
webfont --config webfont.config.json -d dist/icons
```
