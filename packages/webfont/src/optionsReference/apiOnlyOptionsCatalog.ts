/** Programmatic-only options documented in configuration.md but absent from CLI_FLAG_SECTIONS. */
export const API_ONLY_OPTION_DESCRIPTIONS = {
  files: {
    description:
      "A file glob or array of globs passed to fast-glob. SVG mode: .svg paths; do not mix with .ttf or .woff/.woff2 in one run.",
  },
  svgTools: {
    cliEquivalent: "svgDiagnose",
    description:
      "Alpha SVG tooling (for example `{ diagnose: true }`). CLI exposes this as `--svg-diagnose` (`svgDiagnose` flag).",
  },
  glyphContentTransformFn: {
    description:
      "Transform SVG glyph contents before font generation (for example stroke-to-fill via svg-outline-stroke; not bundled).",
  },
  glyphTransformFn: {
    description: "Transform each glyph stream after SVG parsing and before font generation.",
  },
  metadataProvider: {
    description: "Async hook to supply per-glyph metadata (unicode, name) when filenames omit prefixes.",
  },
  writeResultFiles: {
    description:
      "Node helper to persist a webfont() Result to disk; requires dest (and destCreate when the folder may not exist).",
  },
} as const;

export type ApiOnlyOptionKey = keyof typeof API_ONLY_OPTION_DESCRIPTIONS;
