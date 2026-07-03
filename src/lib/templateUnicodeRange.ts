import type { GlyphMetadata } from "../types/GlyphMetadata";

const formatCodePoint = (codePoint: number): string => {
  let width = 4;

  if (codePoint > 0xffff) {
    width = 6;
  }

  return codePoint.toString(16).toUpperCase().padStart(width, "0");
};

const codePointFromUnicodeEntry = (value: string): number | undefined => {
  if (value.length === 0 || value.length > 2) {
    return undefined;
  }

  const codePoint = value.codePointAt(0);

  if (codePoint === undefined) {
    return undefined;
  }

  // Ligature names are multi-code-unit ASCII identifiers (for example "avatar").
  if (value.length > 1 && codePoint < 0x80) {
    return undefined;
  }

  return codePoint;
};

export const collectCodePointsFromGlyphs = (glyphs: readonly Pick<GlyphMetadata, "unicode">[]): number[] => {
  const codePoints: number[] = [];

  for (const glyph of glyphs) {
    for (const entry of glyph.unicode ?? []) {
      const codePoint = codePointFromUnicodeEntry(entry);

      if (codePoint !== undefined) {
        codePoints.push(codePoint);
      }
    }
  }

  return codePoints;
};

export const computeUnicodeRangeFromGlyphs = (
  glyphs: readonly Pick<GlyphMetadata, "unicode">[],
): string | undefined => {
  const codePoints = collectCodePointsFromGlyphs(glyphs);

  if (codePoints.length === 0) {
    return undefined;
  }

  const min = Math.min(...codePoints);
  const max = Math.max(...codePoints);

  if (min === max) {
    return `U+${formatCodePoint(min)}`;
  }

  return `U+${formatCodePoint(min)}-${formatCodePoint(max)}`;
};

export const resolveTemplateUnicodeRange = (
  unicodeRange: boolean | string | undefined,
  glyphs: readonly Pick<GlyphMetadata, "unicode">[],
): string | undefined => {
  if (unicodeRange === false) {
    return undefined;
  }

  if (typeof unicodeRange === "string") {
    return unicodeRange;
  }

  return computeUnicodeRangeFromGlyphs(glyphs);
};
