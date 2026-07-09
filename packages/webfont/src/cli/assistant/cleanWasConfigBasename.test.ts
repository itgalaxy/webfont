import { describe, expect, it } from "vitest";
import { cleanWasConfigBasename, resolveWasConfigPath } from "./cleanWasConfigBasename";

describe("cleanWasConfigBasename", () => {
  it("should strip path segments from wizard or .was font names", () => {
    expect(cleanWasConfigBasename("../MyFont")).toBe("MyFont");
    expect(cleanWasConfigBasename("nested/MyFont")).toBe("MyFont");
  });

  it("should not allow empty or traversal-only basenames", () => {
    expect(() => cleanWasConfigBasename("../..")).toThrow(/Invalid font name/u);
    expect(() => cleanWasConfigBasename("   ")).toThrow(/Invalid font name/u);
  });
});

describe("resolveWasConfigPath", () => {
  it("should write .was files under dest using a cleaned basename", () => {
    expect(resolveWasConfigPath({ dest: "assets/fonts", name: "../MyFont" })).toBe("assets/fonts/MyFont.was");
  });
});
