import type { Config } from "svgo";
import type { GlyphData } from "../types/GlyphData";
import { applyOptimizeSvgToGlyphs } from "./applyOptimizeSvgToGlyphs";
import { defaultWebfontSvgoConfig, optimizeSvgContents } from "./optimizeSvgGlyphs";

describe("optimizeSvgGlyphs", () => {
  it("should expose a conservative default plugin list without preset-default", () => {
    const config = defaultWebfontSvgoConfig();

    expect(config.plugins).toEqual([
      "removeDoctype",
      "removeXMLProcInst",
      "removeComments",
      "removeMetadata",
      "removeEditorsNSData",
      "removeDesc",
      "cleanupAttrs",
      "removeUnusedNS",
    ]);
  });

  it("should remove comments and metadata from SVG contents", () => {
    const input = `<?xml version="1.0" encoding="UTF-8"?>
<!-- editor comment -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <metadata>ignore</metadata>
  <path d="M0 0h24v24H0z" fill="#000"/>
</svg>`;

    const output = optimizeSvgContents(input, "icon.svg");

    expect(output).not.toContain("editor comment");
    expect(output).not.toContain("<metadata>");
    expect(output).toContain('viewBox="0 0 24 24"');
    expect(output).toContain('d="M0 0h24v24H0z"');
  });

  it("should use caller plugins when svgoConfig.plugins is set", () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';
    const config: Config = { plugins: ["removeComments"] };

    expect(optimizeSvgContents(input, "plain.svg", config)).toBe(input);
  });
});

describe("applyOptimizeSvgToGlyphs", () => {
  it("should optimize each glyph contents in place", () => {
    const glyphs: GlyphData[] = [
      {
        contents: `<!-- c --><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="M0 0h8v8H0z"/></svg>`,
        srcPath: "a.svg",
        metadata: { name: "a" },
      },
    ];

    const optimized = applyOptimizeSvgToGlyphs(glyphs);

    expect(optimized[0]?.contents).not.toContain("<!-- c -->");
    expect(optimized[0]?.srcPath).toBe("a.svg");
  });
});
