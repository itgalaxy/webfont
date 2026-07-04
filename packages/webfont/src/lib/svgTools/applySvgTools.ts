import type { GlyphData } from "../../types/GlyphData";
import type { SvgGlyphDiagnostic, SvgToolsOptions } from "../../types/SvgToolsOptions";
import { applySvgDiagnosticsToGlyphs, type SvgToolsReporter } from "./applySvgDiagnostics";

export type { SvgToolsReporter } from "./applySvgDiagnostics";

export type ApplySvgToolsResult = {
  diagnostics: SvgGlyphDiagnostic[];
  glyphs: GlyphData[];
};

export type ApplySvgToolsRuntime = {
  reporter?: SvgToolsReporter;
  /** When true, logs evenodd diagnostics even if svgTools.diagnose is off (backward compatible with --verbose). */
  verbose?: boolean;
};

export const applySvgToolsToGlyphs = (
  glyphsData: GlyphData[],
  svgToolsInput: SvgToolsOptions | undefined,
  runtime: ApplySvgToolsRuntime = {},
): ApplySvgToolsResult => {
  const { diagnostics, glyphs } = applySvgDiagnosticsToGlyphs(glyphsData, svgToolsInput, runtime);

  return {
    diagnostics,
    glyphs,
  };
};
