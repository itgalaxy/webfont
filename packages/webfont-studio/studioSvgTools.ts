import type {
  SvgGlyphDiagnostic,
  SvgToolsOptions as WebfontSvgToolsOptions,
} from "@webfont/types/SvgToolsOptions";

export type StudioSvgFixMode = "outline-stroke";

/** Studio-only extension: browser WASM outline-stroke fix (not part of webfont package API). */
export type StudioSvgToolsOptions = WebfontSvgToolsOptions & {
  fix?: boolean | StudioSvgFixMode[];
};

const DEFAULT_SVG_FIXES: StudioSvgFixMode[] = ["outline-stroke"];

export const normalizeStudioSvgFixOption = (fix: StudioSvgToolsOptions["fix"]): StudioSvgFixMode[] | undefined => {
  if (fix === undefined || fix === false) {
    return undefined;
  }

  if (fix === true) {
    return [...DEFAULT_SVG_FIXES];
  }

  if (fix.length === 0) {
    return undefined;
  }

  return fix;
};

const FIXABLE_CODES = new Set<SvgGlyphDiagnostic["code"]>(["stroke-only", "unsupported-element"]);

export const glyphDiagnosticsMatchFixMode = (
  diagnostics: readonly SvgGlyphDiagnostic[],
  fixMode: StudioSvgFixMode,
): boolean => {
  if (fixMode !== "outline-stroke") {
    return false;
  }

  return diagnostics.some((entry) => FIXABLE_CODES.has(entry.code));
};
