import isWoff2 from "is-woff2";
import standalone from "../standalone";
import { webfontFromGlyphs } from "./webfontFromGlyphs";

const fixturesGlob = "src/fixtures";

describe("webfontFromGlyphs", () => {
  it("should generate woff2 from in-memory SVG glyphs", async () => {
    const fromFiles = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["woff2"],
    });

    expect(fromFiles.glyphsData).toBeDefined();

    const fromGlyphs = await webfontFromGlyphs({
      glyphs:
        fromFiles.glyphsData?.map((glyph) => ({
          contents: glyph.contents,
          srcPath: glyph.srcPath,
        })) ?? [],
      formats: ["woff2"],
    });

    expect(isWoff2(fromGlyphs.woff2)).toBe(true);
    expect(fromGlyphs.hash).toBe(fromFiles.hash);
  });
});
