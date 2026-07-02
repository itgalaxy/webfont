# ADR 0007: WOFF / WOFF2 decompression pipeline

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [FEATURES.md](../../FEATURES.md) (WOFF / WOFF2 container decompression), [NOTICE.md](../../NOTICE.md) §3.2, PR [#689](https://github.com/itgalaxy/webfont/pull/689), PR [#691](https://github.com/itgalaxy/webfont/pull/691)

## Context

webfont historically generated icon fonts from SVG inputs. Users also need to **extract the SFNT payload** inside `.woff` and `.woff2` webfont containers (TrueType or OpenType outlines) without re-encoding to other web formats.

This is **decompression**, not arbitrary font transcoding:

| Operation | Supported? |
|-----------|------------|
| WOFF/WOFF2 → TTF or OTF (matching inner SFNT flavor) | Yes |
| TTF ↔ OTF outline conversion | No — use FontForge or similar |
| Merge multiple weights into one SFNT | No — one output per input |
| SVG icon pipeline with `otf` output | No — `otf` is webfont-decompress only |

Initial implementation (PR #689) accepted **one** local `.woff` / `.woff2` per run. Follow-up (PR #691) added **batch** inputs (paths, globs) and **`http(s)` URLs**.

## Decision drivers

- **Correct semantics:** Detect SFNT flavor after decompression (`0x00010000` / `true` → TTF, `OTTO` → OTF) and reject mismatched `formats` requests with actionable errors.
- **Reuse maintained tooling:** [fontverter](https://github.com/papandreou/fontverter) handles WOFF/WOFF2 → SFNT; pin `wawoff2` and `woff2sfnt-sfnt2woff` for reproducible installs (see `package.json` `overrides`).
- **Clear public API:** Batch results live on `result.decompressedFonts` (`{ source, ttf?, otf? }[]`). A single input still mirrors `ttf` / `otf` on `result` for backward compatibility.
- **Remote inputs:** Node `fetch()` with `is-woff` / `is-woff2` validation; extension derived from URL pathname (query strings allowed).
- **Licensing:** Decompression does not grant font rights; document in [NOTICE.md](../../NOTICE.md).

## Decision

**Add a dedicated webfont decompression pipeline** alongside the existing SVG icon pipeline.

### Input classification

`classifyInputFiles()` in `src/standalone/inputMode.ts` routes runs:

- **SVG mode** — one or more `.svg` files (default pipeline).
- **Webfont mode** — one or more `.woff` / `.woff2` paths, globs, or `http(s)` URLs.
- **Mixed / unsupported** — reject (e.g. `.svg` + `.woff2`, extension-less paths matched by globs).

`resolveInputSources()` (`src/lib/inputSource.ts`) expands globs via `globby` and passes through URL patterns unchanged.

### Decompression flow

1. Read bytes from disk (`fs/promises`) or URL (`fetchWebfontFromUrl`).
2. `fontverter.convert(buffer, "sfnt")` → decompressed SFNT `Buffer`.
3. `getSfntFlavor()` (`src/lib/sfnt/flavor.ts`) reads the first four bytes.
4. For each requested `ttf` / `otf` format, assign the buffer only when flavor matches; otherwise throw.

### Batch and naming

- `convertWebfontInput()` decompresses all sources in parallel (`Promise.all`).
- CLI writes `{basename}.ttf` / `.otf` per entry in `decompressedFonts`.
- Colliding basenames (e.g. `iconfont.woff` + `iconfont.woff2`) use `-woff` / `-woff2` suffixes (`resolveDecompressedFontBasenames`).
- Single-input CLI runs still honor `-u` / `fontName`.

### Excluded options in webfont mode

`template` and `glyphTransformFn` reject with explicit errors — they apply only to the SVG pipeline.

## Consequences

### Positive

- Users can decompress local fonts, globs, and CDN URLs in one API/CLI call.
- SFNT flavor guards prevent silent mislabeling (TTF bytes named `.otf`).
- `FEATURES.md` and `NOTICE.md` document limits and licensing expectations.

### Negative / trade-offs

- **No merge:** Multiple Inter weights yield multiple TTF files, not one variable font.
- **URL policy:** Callers must have rights to fetch remote bytes; no authentication headers in v1.
- **Network dependency:** URL inputs require Node 18+ `fetch` and fail on non-200 responses.

### Follow-up

- Optional request headers / redirect limits for authenticated font URLs.
- Production-mode knip coverage for new modules (see [ADR 0008](./0008-knip-instead-of-depcheck.md)).

## References

- [fontverter](https://github.com/papandreou/fontverter)
- [FEATURES.md](../../FEATURES.md) — WOFF / WOFF2 container decompression
- [NOTICE.md](../../NOTICE.md) §3.2 — WOFF / WOFF2 decompression licensing
