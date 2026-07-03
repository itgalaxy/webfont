import {
  collectCodePointsFromGlyphs,
  computeUnicodeRangeFromGlyphs,
  resolveTemplateUnicodeRange,
} from "./templateUnicodeRange";

describe("templateUnicodeRange", () => {
  const glyphsWithLigatures = [
    { unicode: [String.fromCodePoint(0xea01), "avatar"] },
    { unicode: [String.fromCodePoint(0xea02), "envelope"] },
    { unicode: [String.fromCodePoint(0xea03), "phone_call"] },
  ];

  it("should collect icon code points and ignore ligature names", () => {
    expect(collectCodePointsFromGlyphs(glyphsWithLigatures)).toEqual([0xea01, 0xea02, 0xea03]);
  });

  it("should format a min-max unicode-range from glyphs", () => {
    expect(computeUnicodeRangeFromGlyphs(glyphsWithLigatures)).toBe("U+EA01-EA03");
  });

  it("should format a single-codepoint unicode-range", () => {
    expect(computeUnicodeRangeFromGlyphs([{ unicode: [String.fromCodePoint(0xea01)] }])).toBe("U+EA01");
  });

  it("should resolve auto unicode-range by default", () => {
    expect(resolveTemplateUnicodeRange(undefined, glyphsWithLigatures)).toBe("U+EA01-EA03");
    expect(resolveTemplateUnicodeRange(true, glyphsWithLigatures)).toBe("U+EA01-EA03");
  });

  it("should omit unicode-range when disabled", () => {
    expect(resolveTemplateUnicodeRange(false, glyphsWithLigatures)).toBeUndefined();
  });

  it("should use a manual unicode-range override", () => {
    expect(resolveTemplateUnicodeRange("U+EA01-EAFF", glyphsWithLigatures)).toBe("U+EA01-EAFF");
  });
});
