import { describe, expect, it } from "vitest";
import { cleanOptionalWasBasename, cleanWasConfigBasename, resolveWasConfigPath } from "./cleanWasConfigBasename";

describe("cleanWasConfigBasename", () => {
  it("should strip path segments from wizard or .was font names", () => {
    expect(cleanWasConfigBasename("../MyFont")).toBe("MyFont");
    expect(cleanWasConfigBasename("nested/MyFont")).toBe("MyFont");
  });

  it("should not allow empty or traversal-only basenames", () => {
    expect(() => cleanWasConfigBasename("../..")).toThrow(/Invalid font name/u);
    expect(() => cleanWasConfigBasename("   ")).toThrow(/Invalid font name/u);
  });

  it("should reject non-string values with a field-specific TypeError", () => {
    expect(() => cleanWasConfigBasename(42, "prefix")).toThrow('Invalid .was config: "prefix" must be a string');
  });
});

describe("cleanOptionalWasBasename", () => {
  it("should ignore nullish or blank optional values", () => {
    expect(cleanOptionalWasBasename(undefined, "fontId")).toBeUndefined();
    expect(cleanOptionalWasBasename(null, "fontId")).toBeUndefined();
    expect(cleanOptionalWasBasename("   ", "fontId")).toBeUndefined();
  });

  it("should reject non-string optional values with a field-specific TypeError", () => {
    expect(() => cleanOptionalWasBasename(42, "fontId")).toThrow('Invalid .was config: "fontId" must be a string');
  });
});

describe("resolveWasConfigPath", () => {
  it("should write .was files under dest using a cleaned basename", () => {
    expect(resolveWasConfigPath({ dest: "assets/fonts", name: "../MyFont" })).toBe("assets/fonts/MyFont.was");
  });
});
