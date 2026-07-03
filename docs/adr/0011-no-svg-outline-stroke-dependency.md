# ADR 0011: Do not bundle svg-outline-stroke or stroke-to-fill fixes

- **Status:** Accepted
- **Date:** 2026-07-03
- **Related:** [#144](https://github.com/itgalaxy/webfont/issues/144) (`glyphContentTransformFn`), svgTools diagnostics (alpha)

## Context

Stroke-based SVG icons (`fill="none"` + `stroke`) and some primitive elements (`<line>`, `<polyline>`) do not map cleanly to icon fonts: **svgicons2svgfont** traces filled paths and ignores stroke attributes.

[`svg-outline-stroke`](https://github.com/elrumordelaluz/outline-stroke) is a popular preprocessor that rasterizes strokes and retraces them as filled paths (via **sharp** and **potrace**). It is a reasonable choice for authors who need stroke-to-fill conversion before font generation.

Problems with making it a **direct dependency** of webfont:

| Issue | Detail |
|-------|--------|
| **Native toolchain** | `svg-outline-stroke` pulls **sharp** (native bindings) and **potrace**; install size, platform support, and CI complexity increase for every consumer of webfont. |
| **Licensing surface** | Potrace is **GPL-2.0**. Bundling or invoking it from webfont blurs responsibility and may affect downstream products. |
| **Scope creep** | webfont’s job is SVG → font formats (and related encode/decompress pipelines), not general-purpose SVG cleanup or tracing. |
| **User choice** | Authors may prefer [svg-fixer](https://github.com/oslllo/svg-fixer), manual edits in a design tool, or a different tracing stack. A built-in fix picks one stack for everyone. |

Issue **#144** already added **`glyphContentTransformFn`**: a hook that runs **before** font generation so callers can preprocess glyph SVG strings with any tool they install themselves.

## Decision drivers

- **Minimal dependencies:** Keep the published package lean and avoid native optional deps unless core to all pipelines.
- **Clear boundaries:** Diagnose incompatibilities; do not own stroke retracing or third-party tracing licenses.
- **Composable API:** Hooks (`glyphContentTransformFn`) let integrators wire their own preprocessor without webfont taking a stance on which library to use.
- **Documentation over bundling:** README examples can show `svg-outline-stroke` without listing it in `package.json`.

## Decision

**webfont must never declare `svg-outline-stroke` (or equivalent stroke-to-fill tracers) as a runtime or dev dependency.**

1. **No built-in stroke-to-fill fix** in `svgTools.fix`, CLI `--svg-fix`, or any other first-party code path that imports a tracing library.
2. **`svgTools` is diagnostics-only** (alpha): detect `fill-rule: evenodd`, stroke-only SVGs, and poorly supported elements; surface warnings and `result.svgDiagnostics`.
3. **Stroke preprocessing is caller responsibility** via `glyphContentTransformFn` (or external editing). The README documents an optional `svg-outline-stroke` example; users add that package to **their** project when they need it.
4. **Do not reintroduce** `svg-outline-stroke` through transitive bundling in the main library build. Future ADRs or features that need SVG mutation must use hooks or stay out of scope.

## Consequences

### Positive

- Smaller install footprint; no sharp/potrace in webfont’s dependency tree.
- GPL and native-binding concerns stay with the application that chooses a tracer.
- `svgTools.diagnose` remains useful without implying webfont can auto-repair every flagged issue.

### Negative

- One extra step for stroke icons: install a preprocessor and pass `glyphContentTransformFn` (documented in README).
- No single CLI flag for automatic stroke conversion; users script the hook or use config that sets `glyphContentTransformFn`.

### Neutral

- `glyphContentTransformFn` (#144) is the supported integration point; examples may reference `svg-outline-stroke` as one option among many.

## Compliance

- `package.json` must not list `svg-outline-stroke`.
- `npm run depcheck` (Knip) should not require exceptions for tracing libraries used only in docs.
- User-facing docs: keep the README `glyphContentTransformFn` example; point stroke issues from `svgTools.diagnose` and TROUBLESHOOTING to that hook, not to a bundled fixer.

## References

- [README — `glyphContentTransformFn`](../../README.md#glyphcontenttransformfn)
- [README — `svgTools` (alpha)](../../README.md#svgtools-alpha)
- [svg-outline-stroke](https://github.com/elrumordelaluz/outline-stroke)
- Issue [#144](https://github.com/itgalaxy/webfont/issues/144)
