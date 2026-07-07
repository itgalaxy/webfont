import { describe, expect, it } from "vitest";
import { buildMcpOptionsReference } from "./listWebfontOptionsContent.js";

describe("buildMcpOptionsReference", () => {
  it("should include core defaults and CLI flag metadata from webfont", () => {
    const reference = buildMcpOptionsReference();

    expect(reference.defaults.fontName).toBe("webfont");
    expect(reference.cliFlags.fontName.description).toContain("font family name");
    expect(reference.apiOnly.files.description).toMatch(/fast-glob/u);
  });

  it("should include MCP-specific tools and notes", () => {
    const reference = buildMcpOptionsReference();

    expect(reference.mcpTools.convert_svgs_to_font).toBeDefined();
    expect(reference.notes.length).toBeGreaterThan(0);
  });
});
