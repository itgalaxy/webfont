import { diagnoseGlyphsData } from "@webfont/lib/svgDiagnostics/diagnoseSvgContents";
import type { GlyphData } from "@webfont/types/GlyphData";
import { ensureOutlineStrokeWasmReady, outlineStrokeWithWasm } from "./outlineStrokeWasm";
import {
  glyphDiagnosticsMatchFixMode,
  normalizeStudioSvgFixOption,
  type StudioSvgToolsOptions,
} from "./studioSvgTools";

export const applySvgFixesInBrowserWorker = async (
  glyphs: GlyphData[],
  svgTools: StudioSvgToolsOptions | undefined,
  reporter?: (message: string) => void,
): Promise<GlyphData[]> => {
  const requestedFix = normalizeStudioSvgFixOption(svgTools?.fix);

  if (!requestedFix || requestedFix.length === 0) {
    return glyphs;
  }

  const diagnostics = diagnoseGlyphsData(glyphs);
  const fixModes = requestedFix.filter((fixMode) =>
    diagnostics.some((entry) => glyphDiagnosticsMatchFixMode([entry], fixMode)),
  );

  if (!fixModes.includes("outline-stroke")) {
    reporter?.("[webfont:svgTools] No fixable issues detected for the requested fix mode(s).");
    return glyphs;
  }

  await ensureOutlineStrokeWasmReady();
  reporter?.('[webfont:svgTools] Applying fix "outline-stroke" (Potrace WASM)…');

  return Promise.all(
    glyphs.map(async (glyph) => {
      const glyphDiagnostics = diagnostics.filter((entry) => entry.srcPath === glyph.srcPath);

      if (!glyphDiagnosticsMatchFixMode(glyphDiagnostics, "outline-stroke")) {
        return glyph;
      }

      reporter?.(`[webfont:svgTools] outline-stroke: ${glyph.srcPath}`);
      const contents = await outlineStrokeWithWasm(glyph.contents);

      return {
        ...glyph,
        contents,
      };
    }),
  );
};
