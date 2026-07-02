# ADR 0009: TTF to webfont encoding pipeline

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [FEATURES.md](../../FEATURES.md) (TTF to webfont encoding), [NOTICE.md](../../NOTICE.md) §3.3, Issue [#13](https://github.com/itgalaxy/webfont/issues/13)

## Context

Users need to convert existing **TrueType (`.ttf`)** fonts to web formats (`woff`, `woff2`, legacy `eot`) without rebuilding from SVG icons. webfont already ships `ttf2woff`, `wawoff2`, and `ttf2eot` for the SVG pipeline; issue [#13](https://github.com/itgalaxy/webfont/issues/13) requested exposing that path for TTF input.

An abandoned PR ([#185](https://github.com/itgalaxy/webfont/pull/185)) used a `ttfMode` boolean. Maintainers and reporters preferred **auto-detection** from file extension (same pattern as WOFF/WOFF2 decompression in [ADR 0007](./0007-woff-woff2-decompression-pipeline.md)).

## Decision drivers

- **No new public flag:** Extend `classifyInputFiles()` with a `ttf` mode when all matched paths end in `.ttf`.
- **Reuse encoders:** Share `encodeTtfToEot` / `encodeTtfToWoff` / `encodeTtfToWoff2` (`src/lib/ttfEncode.ts`) with the SVG pipeline.
- **Batch API:** `result.transcodedFonts` mirrors `decompressedFonts` for multi-file runs; single input keeps top-level `result.woff` / `result.woff2` for backward compatibility with CLI naming.
- **Clear limits:** TrueType input only (`is-ttf` + SFNT flavor guard). No templates or `glyphTransformFn`. No merge of multiple weights.

## Decision

**Add a dedicated TTF encoding pipeline** alongside SVG and WOFF/WOFF2 decompression.

### Input classification

`classifyInputFiles()` routes:

- **SVG mode** — `.svg` only.
- **TTF mode** — `.ttf` only.
- **Webfont mode** — `.woff` / `.woff2` (and URLs).
- **Mixed** — any combination of the above → reject.

### Encoding flow

1. Read TTF bytes from disk (`fs/promises`).
2. Validate with `is-ttf` and `getSfntFlavor()` (reject OTF/CFF masquerading as `.ttf`).
3. For each requested format in `resolveTtfConversionFormats()`:
   - `ttf` — pass-through buffer;
   - `eot` / `woff` / `woff2` — existing encoders.
4. Default output when SVG-pipeline `formats` are unchanged: `['woff', 'woff2']`.

### CLI batch naming

Reuse `resolveDecompressedFontBasenames()` (strip extension; suffix on basename collisions). `writeTranscodedFontFiles()` writes per-format files under `--dest`.

## Consequences

### Positive

- Fulfills long-standing [#13](https://github.com/itgalaxy/webfont/issues/13) without a breaking API flag.
- Round-trip compatible with WOFF/WOFF2 decompression (encode → decompress → valid TTF).

### Negative / trade-offs

- **No OTF input** — PostScript/CFF fonts must be converted externally first.
- **No remote TTF URLs** in v1 (local paths/globs only).
- **No CSS templates** in TTF mode (fonts already exist; `@font-face` is user-owned).

## References

- Issue [#13](https://github.com/itgalaxy/webfont/issues/13)
- PR [#185](https://github.com/itgalaxy/webfont/pull/185) (historical `ttfMode` approach)
- [ADR 0007](./0007-woff-woff2-decompression-pipeline.md)
