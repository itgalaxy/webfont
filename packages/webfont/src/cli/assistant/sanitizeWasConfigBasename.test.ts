import { describe, expect, it } from "vitest";
import { resolveWasConfigPath, sanitizeWasConfigBasename } from "./sanitizeWasConfigBasename";

describe("sanitizeWasConfigBasename", () => {
  it("should strip path segments from wizard or .was font names", () => {
    expect(sanitizeWasConfigBasename("../MyFont")).toBe("MyFont");
    expect(sanitizeWasConfigBasename("nested/MyFont")).toBe("MyFont");
  });

  it("should not allow empty or traversal-only basenames", () => {
    expect(() => sanitizeWasConfigBasename("../..")).toThrow(/Invalid font name/u);
    expect(() => sanitizeWasConfigBasename("   ")).toThrow(/Invalid font name/u);
  });
});

describe("resolveWasConfigPath", () => {
  it("should write .was files under dest using a sanitized basename", () => {
    expect(resolveWasConfigPath({ dest: "assets/fonts", name: "../MyFont" })).toBe("assets/fonts/MyFont.was");
  });
});
