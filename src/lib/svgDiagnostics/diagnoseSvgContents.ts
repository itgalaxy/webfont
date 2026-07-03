import type { SvgDiagnosticCode, SvgGlyphDiagnostic } from "../../types/SvgToolsOptions";
import { hasEvenoddFillRule } from "../evenoddFillRule";

const STROKE_ATTR_PATTERN = /\bstroke\s*=|\bstroke\s*:/iu;
const FILL_NONE_PATTERN = /fill\s*=\s*["']none["']|fill\s*:\s*none/iu;
const UNSUPPORTED_ELEMENT_PATTERN = /<(line|polyline|clipPath)\b/iu;

export const hasStrokeOnlySvg = (svgContents: string): boolean => {
  if (!STROKE_ATTR_PATTERN.test(svgContents)) {
    return false;
  }

  return FILL_NONE_PATTERN.test(svgContents);
};

export const hasUnsupportedSvgElements = (svgContents: string): boolean =>
  UNSUPPORTED_ELEMENT_PATTERN.test(svgContents);

const diagnosticMessage = (code: SvgDiagnosticCode, srcPath: string): string => {
  switch (code) {
    case "evenodd-fill-rule":
      return `[webfont:diagnose] ${srcPath} uses fill-rule: evenodd. Icon fonts render glyphs with the nonzero fill rule, so holes and counter-shapes can disappear. See TROUBLESHOOTING.md ("Icon details missing after export").`;
    case "stroke-only":
      return `[webfont:diagnose] ${srcPath} uses stroke-based paths (fill="none"). svgicons2svgfont ignores stroke; outlines may render as solid shapes or lose detail. Preprocess with glyphContentTransformFn (for example svg-outline-stroke) before conversion. See TROUBLESHOOTING.md ("Icon details missing after export").`;
    case "unsupported-element":
      return `[webfont:diagnose] ${srcPath} contains <line>, <polyline>, or <clipPath>. These elements are poorly supported in icon fonts; results may differ from the browser preview. Convert to filled paths or preprocess with glyphContentTransformFn.`;
    default: {
      const exhaustive: never = code;
      return exhaustive;
    }
  }
};

export const diagnoseSvgContents = (srcPath: string, svgContents: string): SvgGlyphDiagnostic[] => {
  const diagnostics: SvgGlyphDiagnostic[] = [];

  if (hasEvenoddFillRule(svgContents)) {
    diagnostics.push({
      code: "evenodd-fill-rule",
      message: diagnosticMessage("evenodd-fill-rule", srcPath),
      srcPath,
    });
  }

  if (hasStrokeOnlySvg(svgContents)) {
    diagnostics.push({
      code: "stroke-only",
      message: diagnosticMessage("stroke-only", srcPath),
      srcPath,
    });
  }

  if (hasUnsupportedSvgElements(svgContents)) {
    diagnostics.push({
      code: "unsupported-element",
      message: diagnosticMessage("unsupported-element", srcPath),
      srcPath,
    });
  }

  return diagnostics;
};

export const diagnoseGlyphsData = (
  glyphs: ReadonlyArray<{ contents: string; srcPath: string }>,
): SvgGlyphDiagnostic[] => glyphs.flatMap((glyph) => diagnoseSvgContents(glyph.srcPath, glyph.contents));

export const shouldLogDiagnostic = (
  diagnostic: SvgGlyphDiagnostic,
  options: { diagnose?: boolean; verbose?: boolean },
): boolean => {
  if (options.diagnose) {
    return true;
  }

  return Boolean(options.verbose && diagnostic.code === "evenodd-fill-rule");
};
