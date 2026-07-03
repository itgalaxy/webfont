# webfont - Features

Canonical list of product capabilities. **Update this file in the same PR** whenever behavior, supported inputs/outputs, or public options change (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

## Features

### SVG icon font generation

- **Stability**: stable
- **Description**: Build a font from one or more `.svg` icon files (icon font / webfont workflow).
- **Properties**:
  - Input: globs resolving to `.svg` files only (every matched file must have a `.svg` extension).
  - Uses [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) to merge icons into an SVG font, then derives other formats from that TTF pipeline.
  - Does **not** accept `.woff`, `.woff2`, `.ttf`, or `.otf` as input in the same run.
  - **Licensing:** you must have rights to the SVG icons you submit; generated fonts remain subject to those rights and any metadata you set. See [NOTICE.md](./NOTICE.md) §3.1.
- **Test Criteria**:
  - [x] SVG glob produces `svg`, `ttf`, `eot`, `woff`, and `woff2` with default `formats`
  - [x] Empty or unsupported globs reject with a clear error
  - [x] Mixed `.svg` + `.woff`/`.woff2` inputs reject

### SVG pipeline output formats

- **Stability**: stable
- **Description**: Emit subset of `svg`, `ttf`, `eot`, `woff`, `woff2` from SVG icon input.
- **Properties**:
  - Default `formats`: `['svg', 'ttf', 'eot', 'woff', 'woff2']`.
  - `otf` is **not** supported for SVG input (the pipeline produces TrueType outlines via `svg2ttf`).
  - Requesting `otf` with SVG input fails early with an explicit error (no silent success, no empty `otf` buffer).
  - `eot`, `woff`, and `woff2` are generated from the intermediate TTF buffer.
- **Test Criteria**:
  - [x] `--formats` / `formats` option limits written outputs
  - [x] SVG input with `formats: ['otf']` rejects
  - [x] Built-in CSS template works with default SVG formats

### TTF to webfont encoding

- **Stability**: in-progress
- **Description**: Encode one or more `.ttf` TrueType files to `eot`, `woff`, and/or `woff2` (and optional TTF pass-through). Auto-detected from input extension — no separate flag (see [#13](https://github.com/itgalaxy/webfont/issues/13)).
- **Properties**:
  - Input: one or more local `.ttf` paths or globs per run.
  - Output: `ttf` (copy), `eot`, `woff`, and/or `woff2` per input via existing encoders (`ttf2eot`, `ttf2woff`, `wawoff2`).
  - Batch results on `result.transcodedFonts` (`{ source, ttf?, eot?, woff?, woff2? }[]`). Single input mirrors buffers on `result` top level.
  - Default `formats` when SVG-pipeline defaults are still configured: `['woff', 'woff2']`.
  - Does **not** accept `.otf` input (TrueType only). Does **not** merge multiple weights into one file.
  - `template` and `glyphTransformFn` are not supported in this mode.
  - `glyphContentTransformFn` is not supported in this mode.
  - **Licensing:** encoding does not grant rights to the font; users must comply with the font’s license. See [NOTICE.md](./NOTICE.md) §3.3.
  - **Architecture:** see [ADR 0009](docs/adr/0009-ttf-webfont-encoding-pipeline.md).
- **Test Criteria**:
  - [x] `.ttf` input with `formats: ['woff', 'woff2']` yields valid WOFF and WOFF2
  - [x] Default formats produce `woff` + `woff2` when SVG defaults are configured
  - [x] Multiple TTF files encode in one run (`transcodedFonts`)
  - [x] Mixed `.svg` + `.ttf` or `.ttf` + `.woff2` inputs reject
  - [x] Template option in TTF mode rejects
  - [x] CLI writes encoded outputs for a single TTF input

### WOFF / WOFF2 container decompression

- **Stability**: in-progress
- **Description**: Decompress one or more `.woff` / `.woff2` inputs (local paths, globs, or `http(s)` URLs) to the **SFNT payload inside** each file (TTF or OTF), not arbitrary format transcoding or font merging.
- **Properties**:
  - Input: one or more `.woff` / `.woff2` sources per run (paths, globs, and/or URLs).
  - Output: `ttf` and/or `otf` per input — whichever matches each decompressed SFNT flavor (`0x00010000` / `true` → TTF, `OTTO` → OTF).
  - Batch results are exposed on `result.decompressedFonts` (`{ source, ttf?, otf? }[]`). A single input still sets `result.ttf` / `result.otf` at the top level for backward compatibility.
  - CLI writes `{basename}.ttf` / `.otf` per input; colliding basenames (e.g. `iconfont.woff` + `iconfont.woff2`) use `-woff` / `-woff2` suffixes. A single input still honors `-u` / `fontName`.
  - URLs must end in `.woff` or `.woff2` (query strings allowed). Response must be a valid WOFF/WOFF2 container.
  - Does **not** merge multiple weights into one SFNT file (see [NOTICE.md](./NOTICE.md)).
  - Does **not** convert TrueType outlines to PostScript/CFF (TTF → OTF) or the reverse; use an external tool (e.g. FontForge) for that.
  - Does **not** re-encode to `eot`, `woff`, or `woff2` in this mode.
  - Default `formats` when SVG-pipeline defaults are still configured: `['ttf']`.
  - `template` and `glyphTransformFn` are not supported in this mode.
  - `glyphContentTransformFn` is not supported in this mode.
  - **Licensing:** decompression does not grant rights to the font; users must comply with the font’s license for input and extracted output. Copyright/metadata in the SFNT is preserved. See [NOTICE.md](./NOTICE.md) §3.4.
  - **Architecture:** see [ADR 0007](docs/adr/0007-woff-woff2-decompression-pipeline.md).
- **Test Criteria**:
  - [x] `.woff2` input with `formats: ['ttf']` yields a valid TTF when the container holds TrueType
  - [x] `.woff` input with `formats: ['ttf']` yields a valid TTF when the container holds TrueType
  - [x] Multiple webfont files decompress in one run (`decompressedFonts`)
  - [x] HTTPS URL input decompresses when fetch returns a valid WOFF2
  - [x] Requesting `ttf` when the SFNT flavor is OTF rejects with a flavor hint
  - [x] Requesting `otf` when the SFNT flavor is TTF rejects with a flavor hint
  - [x] Template option in webfont conversion mode rejects

### Supported input file classification

- **Stability**: in-progress
- **Description**: Classify matched paths into SVG mode, webfont mode, mixed, or unsupported before running a pipeline.
- **Properties**:
  - Supported extensions: `.svg`, `.ttf`, `.woff`, `.woff2` only.
  - Extension-less paths (e.g. `LICENSE`, `.webfontrc`) are **not** treated as compatible wildcards; globs that match them alongside fonts fail as unsupported.
  - Unsupported extensions (e.g. `.txt`, `.json`) cause the run to fail with “did not match any supported files”.
- **Test Criteria**:
  - [x] Extension-less file + `.woff2` classifies as unsupported (error)
  - [x] `.txt`-only input classifies as unsupported (error)
  - [x] Pure `.svg` / pure `.ttf` / pure `.woff`/`.woff2` classify correctly

### Configuration file discovery

- **Stability**: stable
- **Description**: Load options from cosmiconfig (`package.json` `webfont` key, `.webfontrc`, `webfont.config.js`, etc.).
- **Properties**:
  - Search walks up from cwd when no explicit `configFile` / `--config` is set.
  - Discovered path is exposed on `result.config.filePath` (output metadata only).
- **Test Criteria**:
  - [x] Custom config `formats` are respected
  - [x] Discovered `filePath` attached on conversion runs

### CSS / SCSS / Styl templates

- **Stability**: stable
- **Description**: Generate `@font-face` (or equivalent) from built-in or custom Nunjucks templates.
- **Properties**:
  - Built-in: `css`, `scss`, `styl`.
  - Custom template: path to a Nunjucks file.
  - SVG pipeline only (not webfont decompression or TTF encoding mode).
  - `templateCacheString`: manual query string on font URLs (default `Date.now()`).
  - `addHashInFontUrl`: append MD5 `&v=<hash>` from SVG font content; **filenames stay** `fontName.*` ([#125](https://github.com/itgalaxy/webfont/issues/125)).
  - `unicodeRange`: emit `unicode-range` in built-in `@font-face` from glyph code points (default on); `--no-unicode-range` or `unicodeRange: false` to omit ([#322](https://github.com/itgalaxy/webfont/issues/322)).
- **Test Criteria**:
  - [x] Built-in `css` template snapshot / integration coverage
  - [x] Subset `formats` with template omits unused format URLs
  - [x] `addHashInFontUrl` on `css` and `scss` templates appends content hash to URLs
  - [x] `unicodeRange` adds computed `U+<min>-<max>` to built-in templates; `false` omits it

### Command-line interface (CLI)

- **Stability**: stable
- **Description**: Run `webfont` from the shell via `dist/cli.mjs` (`npm` bin).
- **Properties**:
  - Parses `--formats` as JSON array or comma-separated list.
  - Writes font files to `--dest`; optional template output.
  - Errors and verbose stacks go to **stdout**; **stderr** must stay empty (see integration tests).
  - Exit code `0` on success, `1` on handled errors.
- **Test Criteria**:
  - [x] CLI integration tests cover success, failure, and `--verbose`
  - [x] `parseFormatsFlag` validates format names including `otf`
  - [x] `validateWebfontOptions` rejects unknown `formats` from API and cosmiconfig (#133)

### Option validation

- **Stability**: stable
- **Description**: Reject mis-typed options before running the pipeline.
- **Properties**:
  - `formats` must be a non-empty array of known format names (`svg`, `ttf`, `otf`, `eot`, `woff`, `woff2`).
  - `files`, `fontName`, `template`, and `templateFontPath` type-checked after cosmiconfig merge.
- **Test Criteria**:
  - [x] Unit tests in `validateWebfontOptions.test.ts`
  - [x] Standalone and CLI integration tests for unknown format names (#133)

### Multiple templates

- **Stability**: stable
- **Description**: Generate more than one style/preview template per run.
- **Properties**:
  - `template` accepts a string or array of built-in names (`css`, `html`, `scss`, `styl`, `json`) or custom template paths.
  - `result.templates` lists each rendered output; `result.template` remains the first entry for backward compatibility.
- **Test Criteria**:
  - [x] Standalone and CLI tests for `template: ['html', 'scss']` (#158)

### Glyph metadata hooks

- **Stability**: stable
- **Description**: Customize per-glyph metadata in the SVG pipeline.
- **Properties**:
  - `metadataProvider`: replace default SVG metadata lookup.
  - `glyphTransformFn`: transform metadata after load (SVG mode only).
  - `glyphContentTransformFn`: transform SVG glyph contents before font generation (SVG mode only; e.g. stroke-to-fill via `svg-outline-stroke`, #144).
- **Test Criteria**:
  - [x] `glyphTransformFn` applied before font generation
  - [x] `glyphContentTransformFn` applied before font generation (#144)
  - [x] `metadataProvider` error paths unit-tested (`glyphsData`)

### svgicons2svgfont options

- **Stability**: stable
- **Description**: Pass font metrics and layout options through to svgicons2svgfont (normalize, fixed width, ascent/descent, etc.).
- **Properties**:
  - Documented in README under [svgicons2svgfont](./README.md#svgicons2svgfont).
  - SVG pipeline only.
- **Test Criteria**:
  - [x] Options forwarded via `getFontStreamOptions` / standalone integration tests

### SVG tools — diagnostics (alpha)

- **Stability**: alpha
- **Description**: Scan SVG icon sources for icon-font incompatibilities before font generation. Stroke-to-fill and other SVG repairs are **out of scope** — use `glyphContentTransformFn` (see [ADR 0011](docs/adr/0011-no-svg-outline-stroke-dependency.md)).
- **Properties**:
  - `svgTools.diagnose`: warn about `fill-rule: evenodd`, stroke-only paths, and unsupported SVG elements; populate `result.svgDiagnostics`.
  - CLI flag: `--svg-diagnose` (alpha).
  - `--verbose` still logs evenodd warnings for backward compatibility.
  - Programmatic helpers: `diagnoseSvgContents`, `diagnoseGlyphsData` exported from the package entry.
- **Test Criteria**:
  - [x] Unit tests for stroke/evenodd/element detection
  - [x] `glyphContentTransformFn` applied before font generation (#144)
  - [x] CLI integration tests for `--svg-diagnose`

### Arbitrary format transcoding

- **Stability**: planned
- **Description**: Convert between outline/container formats beyond the current three pipelines (e.g. TTF ↔ OTF transcoding, OTF input encoding).
- **Properties**:
  - **Partially supported:** TTF → `eot` / `woff` / `woff2` (see TTF to webfont encoding). WOFF/WOFF2 → TTF/OTF decompression.
  - **Out of scope today:** OTF input encoding, TTF ↔ OTF outline conversion.
  - External tools (FontForge, fontTools, etc.) are required for TTF → OTF today.
- **Test Criteria**:
  - [x] TTF input encoded to WOFF/WOFF2
  - [ ] TTF input transcoded to OTF
  - [ ] Documented public API for generic transcoding
