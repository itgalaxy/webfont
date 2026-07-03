export type SvgDiagnosticCode = "evenodd-fill-rule" | "stroke-only" | "unsupported-element";

export type SvgGlyphDiagnostic = {
  code: SvgDiagnosticCode;
  message: string;
  srcPath: string;
};

/** Alpha. SVG diagnostics for the icon-font pipeline (see ADR 0011 — no bundled stroke-to-fill fixes). */
export type SvgToolsOptions = {
  /** Scan source SVGs for known icon-font incompatibilities and report warnings. */
  diagnose?: boolean;
  /** Optional sink for diagnostic log lines (for example a web worker or test spy). */
  onMessage?: (message: string) => void;
};
