/** Glyph count above which OpenType ligatures often hurt browser layout (Firefox / DirectWrite). */
export const LARGE_FONT_LIGATURE_GLYPH_THRESHOLD = 2000;

export const shouldWarnLargeFontLigatures = (glyphCount: number, ligaturesEnabled: boolean): boolean =>
  ligaturesEnabled && glyphCount > LARGE_FONT_LIGATURE_GLYPH_THRESHOLD;

export const formatLargeFontLigatureWarning = (glyphCount: number): string =>
  `Warning: ${glyphCount} glyphs with ligatures enabled may cause severe browser slowdown or hangs (especially Firefox on Windows). Ligatures are off by default; enable only if needed: --ligatures or ligatures: true. See TROUBLESHOOTING.md and https://github.com/itgalaxy/webfont/issues/558`;
