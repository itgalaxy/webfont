import { assertNonEmptySvgFontGlyphs, findEmptySvgFontGlyphNames } from "./emptyGlyphPaths";

describe("emptyGlyphPaths", () => {
  it("should list glyph names with empty d attributes", () => {
    const svgFont = `<glyph glyph-name="wave" unicode="&#xEA01;" d="" />
<glyph glyph-name="filled" unicode="&#xEA02;" d="M0 0 L1 1" />`;

    expect(findEmptySvgFontGlyphNames(svgFont)).toEqual(["wave"]);
  });

  it("should ignore missing-glyph without glyph-name", () => {
    const svgFont = `<missing-glyph horiz-adv-x="0" />
<glyph glyph-name="icon" d="M0 0" />`;

    expect(findEmptySvgFontGlyphNames(svgFont)).toEqual([]);
  });

  it("should throw with src paths when SVG font glyphs have no path data (#327)", () => {
    const svgFont = `<glyph glyph-name="wave" unicode="&#xEA01;" d="" />`;

    expect(() =>
      assertNonEmptySvgFontGlyphs(svgFont, [
        {
          metadata: { name: "wave", unicode: [String.fromCodePoint(0xea01)] },
          srcPath: "icons/wave.svg",
        },
      ]),
    ).toThrow(/Empty glyph path\(s\) in SVG font output for: wave \(icons\/wave\.svg\)/u);
  });
});
