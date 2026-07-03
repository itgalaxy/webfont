import {
  formatLargeFontLigatureWarning,
  LARGE_FONT_LIGATURE_GLYPH_THRESHOLD,
  shouldWarnLargeFontLigatures,
} from "./largeFontLigatures";

describe("largeFontLigatures", () => {
  it("should warn above the glyph threshold when ligatures are enabled (#558)", () => {
    expect(LARGE_FONT_LIGATURE_GLYPH_THRESHOLD).toBe(2000);
    expect(shouldWarnLargeFontLigatures(2000, true)).toBe(false);
    expect(shouldWarnLargeFontLigatures(2001, true)).toBe(true);
    expect(shouldWarnLargeFontLigatures(7000, true)).toBe(true);
    expect(shouldWarnLargeFontLigatures(7000, false)).toBe(false);
  });

  it("should format a warning that points to docs and the issue", () => {
    expect(formatLargeFontLigatureWarning(5000)).toContain("5000 glyphs");
    expect(formatLargeFontLigatureWarning(5000)).toContain("--no-ligatures");
    expect(formatLargeFontLigatureWarning(5000)).toContain("issues/558");
  });
});
