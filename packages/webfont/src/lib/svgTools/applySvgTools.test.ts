import { applySvgToolsToGlyphs } from "./applySvgTools";

describe("applySvgToolsToGlyphs", () => {
  it("should diagnose stroke-only SVGs without mutating glyph contents", () => {
    const messages: string[] = [];

    const result = applySvgToolsToGlyphs(
      [
        {
          contents: `<svg fill="none" stroke="currentColor"><line x1="0" y1="0" x2="1" y2="1"/></svg>`,
          srcPath: "stroke.svg",
        },
      ],
      { diagnose: true },
      {
        reporter: (message) => {
          messages.push(message);
        },
      },
    );

    expect(messages.some((message) => message.includes("stroke-based paths"))).toBe(true);
    expect(result.diagnostics.some((entry) => entry.code === "stroke-only")).toBe(true);
    expect(result.glyphs[0]?.contents).toContain('stroke="currentColor"');
  });
});
