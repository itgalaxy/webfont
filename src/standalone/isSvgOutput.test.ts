import fs from "fs";
import isSvg from "is-svg";
import path from "path";
import standalone from "../standalone";

const fixturesGlob = "src/fixtures/svg-icons";

describe("is-svg output validation", () => {
  describe("is-svg library contract (dev dependency)", () => {
    it("should document that is-svg throws TypeError for non-string input", () => {
      expect(() => isSvg(null as unknown as string)).toThrow(TypeError);
      expect(() => isSvg(undefined as unknown as string)).toThrow(TypeError);
      expect(() => isSvg(Buffer.from("") as unknown as string)).toThrow(TypeError);
    });

    it("should document that is-svg returns false for empty string input", () => {
      expect(isSvg("")).toBe(false);
      expect(isSvg("   ")).toBe(false);
    });

    it("should document that is-svg returns false for non-xml text", () => {
      expect(isSvg("not xml")).toBe(false);
    });

    it("should document that is-svg returns false for well-formed xml without an svg root element", () => {
      expect(isSvg("<root><item /></root>")).toBe(false);
      expect(isSvg("<html><body>page</body></html>")).toBe(false);
    });

    it("should document that is-svg returns false for malformed xml", () => {
      expect(isSvg("<svg><unclosed>")).toBe(false);
    });

    it("should document that is-svg returns true when the parsed document has an svg root element", () => {
      expect(isSvg('<svg xmlns="http://www.w3.org/2000/svg"><path /></svg>')).toBe(true);
    });

    it("should document that is-svg depends on @file-type/xml for validate and parse", () => {
      const isSvgPackage = JSON.parse(
        fs.readFileSync(path.join(path.dirname(require.resolve("is-svg")), "package.json"), "utf8"),
      ) as { dependencies: Record<string, string> };

      expect(isSvgPackage.dependencies["@file-type/xml"]).toBeDefined();
    });

    it("should throw when given binary font buffers instead of svg strings", async () => {
      const { woff2 } = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["woff2"],
      });

      expect(woff2).toBeDefined();
      expect(() => isSvg(woff2 as unknown as string)).toThrow(TypeError);
    });
  });

  describe("webfont result.svg validation", () => {
    it("should accept svg font output from standalone as valid svg", async () => {
      const result = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["svg"],
      });

      expect(result.svg).toBeDefined();
      expect(isSvg(result.svg as string)).toBe(true);
    });

    it("should not emit result.svg when only woff2 is requested", async () => {
      const result = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["woff2"],
      });

      expect(result.svg).toBeUndefined();
      expect(result.woff2).toBeDefined();
    });

    it("should not emit result.svg when only woff and woff2 are requested", async () => {
      const result = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["woff", "woff2"],
      });

      expect(result.svg).toBeUndefined();
      expect(result.woff).toBeDefined();
      expect(result.woff2).toBeDefined();
    });

    it("should not emit result.svg when template output is generated without svg format", async () => {
      const result = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["woff2"],
        template: "css",
        templateCacheString: "test",
      });

      expect(result.svg).toBeUndefined();
      expect(result.template).toBeDefined();
    });

    it("should document that absent result.svg must be asserted with toBeUndefined, not is-svg", () => {
      // is-svg 6 throws on undefined; callers must check result.svg before validating.
      expect(() => isSvg(undefined as unknown as string)).toThrow(TypeError);
      expect(undefined).toBeUndefined();
    });
  });
});
