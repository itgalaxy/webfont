import type { GlyphData } from "../../types/GlyphData";

const GLYPH_TAG_PATTERN = /<glyph\b([^>/]*)(?:\/>|>)/giu;
const GLYPH_NAME_PATTERN = /\bglyph-name=["']([^"']+)["']/iu;
const GLYPH_D_PATTERN = /\bd=["']([^"']*)["']/iu;

export const findEmptySvgFontGlyphNames = (svgFont: string): string[] => {
  const emptyNames: string[] = [];

  for (const match of svgFont.matchAll(GLYPH_TAG_PATTERN)) {
    const attributes = match[1] ?? "";
    const nameMatch = GLYPH_NAME_PATTERN.exec(attributes);

    if (nameMatch) {
      const pathMatch = GLYPH_D_PATTERN.exec(attributes);
      const pathData = pathMatch?.[1] ?? "";

      if (pathData.trim().length === 0) {
        emptyNames.push(nameMatch[1]);
      }
    }
  }

  return emptyNames;
};

const resolveSrcPathForGlyphName = (
  glyphName: string,
  glyphsData: ReadonlyArray<Pick<GlyphData, "metadata" | "srcPath">>,
): string | undefined => {
  for (const glyph of glyphsData) {
    const name = glyph.metadata?.name;

    if (name && (glyphName === name || glyphName.startsWith(`${name}-`))) {
      return glyph.srcPath;
    }
  }

  return undefined;
};

const formatEmptyGlyphLocations = (
  emptyGlyphNames: string[],
  glyphsData: ReadonlyArray<Pick<GlyphData, "metadata" | "srcPath">>,
): string => {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const glyphName of emptyGlyphNames) {
    const srcPath = resolveSrcPathForGlyphName(glyphName, glyphsData);
    const key = srcPath ?? glyphName;

    if (!seen.has(key)) {
      seen.add(key);

      if (srcPath) {
        parts.push(`${glyphName} (${srcPath})`);
      } else {
        parts.push(glyphName);
      }
    }
  }

  return parts.join("; ");
};

export const assertNonEmptySvgFontGlyphs = (
  svgFont: string,
  glyphsData: ReadonlyArray<Pick<GlyphData, "metadata" | "srcPath">>,
): void => {
  const emptyGlyphNames = findEmptySvgFontGlyphNames(svgFont);

  if (emptyGlyphNames.length === 0) {
    return;
  }

  const locations = formatEmptyGlyphLocations(emptyGlyphNames, glyphsData);

  throw new Error(
    `Empty glyph path(s) in SVG font output for: ${locations}. ` +
      'Stroke-only SVGs (fill="none" with stroke) often produce empty glyphs because svgicons2svgfont does not convert strokes. ' +
      "Convert strokes to filled paths in your design tool, preprocess with glyphContentTransformFn (for example svg-outline-stroke), " +
      'or run with --svg-diagnose for compatibility warnings. See TROUBLESHOOTING.md ("Stroke-only SVGs produce blank icons").',
  );
};
