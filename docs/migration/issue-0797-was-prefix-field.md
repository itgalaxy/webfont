# `.was` icon prefix: use `prefix` instead of `fontName` ([#797](https://github.com/itgalaxy/webfont/pull/797))

**Minimum version:** *pending*

## What changed

In webfont-assistant-compatible `.was` JSON, the icon class prefix belongs in **`prefix`**. The optional **`fontName`** field in `.was` files historically stored that prefix under the wrong name. New configs written by `--assistant` persist **`prefix` only**; **`fontName` in `.was` is deprecated** and will be removed in a future major release. Loading still accepts legacy `.was` files that only set `fontName` for the prefix.

This does **not** change `webfont()`'s own `fontName` option (output font basename), nor `.was` **`name`** (font display name saved in the config).

## Before

Legacy `.was` files (and older webfont-assistant exports) could store the icon class prefix only in `fontName`:

```json
{
  "name": "MyAwesomeFont",
  "fontName": "my-icon",
  "dest": "dist/fonts",
  "files": "icons/*.svg",
  "template": "css",
  "formats": ["woff2"]
}
```

## After

Prefer `prefix`; new wizard output omits deprecated `.was` `fontName`:

```json
{
  "name": "MyAwesomeFont",
  "prefix": "my-icon",
  "dest": "dist/fonts",
  "files": "icons/*.svg",
  "template": "css",
  "formats": ["woff2"]
}
```

## Workaround on older versions

On npm releases **before** built-in `--assistant` / `--assistant-config`, use [webfont-assistant](https://github.com/kmorope/webfont-assistant) or hand-edit `.was` JSON. Either `prefix` or legacy `fontName` can carry the icon class prefix until the breaking removal ships.

## After upgrading

Install the release that includes built-in assistant support, then:

1. Replace deprecated `.was` `fontName` (when it meant icon prefix) with **`prefix`**.
2. Keep **`name`** as the font display name and **`templateFontName`** when set.
3. Rerun with `webfont --assistant-config path/to/config.was`.
