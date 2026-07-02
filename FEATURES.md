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

### WOFF / WOFF2 container decompression

- **Stability**: in-progress
- **Description**: Decompress a single `.woff` or `.woff2` webfont file to the **SFNT payload inside** (TTF or OTF), not arbitrary format transcoding.
- **Properties**:
  - Input: exactly **one** `.woff` or `.woff2` file per run.
  - Output: `ttf` and/or `otf` only — whichever matches the decompressed SFNT flavor (`0x00010000` / `true` → TTF, `OTTO` → OTF).
  - Does **not** convert TrueType outlines to PostScript/CFF (TTF → OTF) or the reverse; use an external tool (e.g. FontForge) for that.
  - Does **not** re-encode to `eot`, `woff`, or `woff2` in this mode.
  - Default `formats` when SVG-pipeline defaults are still configured: `['ttf']`.
  - `template` and `glyphTransformFn` are not supported in this mode.
- **Test Criteria**:
  - [x] `.woff2` input with `formats: ['ttf']` yields a valid TTF when the container holds TrueType
  - [x] `.woff` input with `formats: ['ttf']` yields a valid TTF when the container holds TrueType
  - [x] Requesting `ttf` when the SFNT flavor is OTF rejects with a flavor hint
  - [x] Requesting `otf` when the SFNT flavor is TTF rejects with a flavor hint
  - [x] Multiple webfont files in one run reject
  - [x] Template option in webfont conversion mode rejects

### Supported input file classification

- **Stability**: in-progress
- **Description**: Classify matched paths into SVG mode, webfont mode, mixed, or unsupported before running a pipeline.
- **Properties**:
  - Supported extensions: `.svg`, `.woff`, `.woff2` only.
  - Extension-less paths (e.g. `LICENSE`, `.webfontrc`) are **not** treated as compatible wildcards; globs that match them alongside fonts fail as unsupported.
  - Unsupported extensions (e.g. `.txt`, `.json`) cause the run to fail with “did not match any supported files”.
- **Test Criteria**:
  - [x] Extension-less file + `.woff2` classifies as unsupported (error)
  - [x] `.txt`-only input classifies as unsupported (error)
  - [x] Pure `.svg` / pure `.woff`/`.woff2` classify correctly

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
  - SVG pipeline only (not webfont decompression mode).
- **Test Criteria**:
  - [x] Built-in `css` template snapshot / integration coverage
  - [x] Subset `formats` with template omits unused format URLs

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

### Glyph metadata hooks

- **Stability**: stable
- **Description**: Customize per-glyph metadata in the SVG pipeline.
- **Properties**:
  - `metadataProvider`: replace default SVG metadata lookup.
  - `glyphTransformFn`: transform metadata after load (SVG mode only).
- **Test Criteria**:
  - [x] `glyphTransformFn` applied before font generation
  - [x] `metadataProvider` error paths unit-tested (`glyphsData`)

### svgicons2svgfont options

- **Stability**: stable
- **Description**: Pass font metrics and layout options through to svgicons2svgfont (normalize, fixed width, ascent/descent, etc.).
- **Properties**:
  - Documented in README under [svgicons2svgfont](./README.md#svgicons2svgfont).
  - SVG pipeline only.
- **Test Criteria**:
  - [x] Options forwarded via `getFontStreamOptions` / standalone integration tests

### Arbitrary format transcoding

- **Stability**: planned
- **Description**: Convert between outline/container formats beyond the current two pipelines (e.g. TTF ↔ OTF transcoding, “any format to any format”).
- **Properties**:
  - **Out of scope today.** WOFF/WOFF2 mode only decompresses; SVG mode only builds TrueType-based outputs.
  - External tools (FontForge, fontTools, etc.) are required for TTF → OTF today.
- **Test Criteria**:
  - [ ] TTF input transcoded to OTF
  - [ ] Documented public API for generic transcoding
