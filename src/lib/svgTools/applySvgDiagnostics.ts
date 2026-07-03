import type { GlyphData } from "../../types/GlyphData";
import type { SvgGlyphDiagnostic } from "../../types/SvgToolsOptions";
import { diagnoseGlyphsData, shouldLogDiagnostic } from "../svgDiagnostics/diagnoseSvgContents";
import { normalizeSvgToolsOptions } from "./normalizeSvgToolsOptions";

export type SvgToolsReporter = (message: string) => void;

export type ApplySvgDiagnosticsResult = {
  diagnostics: SvgGlyphDiagnostic[];
  glyphs: GlyphData[];
};

export const applySvgDiagnosticsToGlyphs = (
  glyphsData: GlyphData[],
  svgToolsInput: { diagnose?: boolean } | undefined,
  runtime: { reporter?: SvgToolsReporter; verbose?: boolean } = {},
): ApplySvgDiagnosticsResult => {
  const svgTools = normalizeSvgToolsOptions(svgToolsInput);
  const diagnostics = diagnoseGlyphsData(glyphsData);
  const { reporter, verbose = false } = runtime;

  for (const diagnostic of diagnostics) {
    if (
      shouldLogDiagnostic(diagnostic, {
        diagnose: svgTools?.diagnose,
        verbose,
      })
    ) {
      reporter?.(diagnostic.message);
    }
  }

  let resultDiagnostics: SvgGlyphDiagnostic[] = [];

  if (svgTools?.diagnose) {
    resultDiagnostics = diagnostics;
  }

  return {
    diagnostics: resultDiagnostics,
    glyphs: glyphsData,
  };
};
