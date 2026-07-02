import isSvg from "is-svg";
import standalone from "../standalone";

const fixturesGlob = "src/fixtures/svg-icons";

describe("is-svg output validation", () => {
  describe("is-svg library contract (dev dependency)", () => {
    it("should document that is-svg returns false for null, undefined, and empty input", () => {
      expect(isSvg(null)).toBe(false);
      expect(isSvg(undefined)).toBe(false);
      expect(isSvg("")).toBe(false);
      expect(isSvg("   ")).toBe(false);
      expect(isSvg(Buffer.from(""))).toBe(false);
    });

    it("should document that is-svg returns false for non-xml text", () => {
      expect(isSvg("not xml")).toBe(false);
      expect(isSvg(Buffer.from("plain text"))).toBe(false);
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
      expect(isSvg(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path /></svg>'))).toBe(true);
    });

    it("should document that is-svg depends on fast-xml-parser for validate and parse", () => {
      const isSvgPackage = jest.requireActual<{ dependencies: Record<string, string> }>("is-svg/package.json");

      expect(isSvgPackage.dependencies["fast-xml-parser"]).toBeDefined();
    });

    it("should reject binary font buffers that are not svg documents", async () => {
      const { woff2 } = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["woff2"],
      });

      expect(woff2).toBeDefined();
      expect(isSvg(woff2)).toBe(false);
    });
  });

  describe("webfont result.svg validation", () => {
    it("should accept svg font output from standalone as valid svg", async () => {
      const result = await standalone({
        files: `${fixturesGlob}/avatar.svg`,
        formats: ["svg"],
      });

      expect(result.svg).toBeDefined();
      expect(isSvg(result.svg)).toBe(true);
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
      // is-svg coerces missing values to false, which cannot distinguish "not generated" from "invalid".
      expect(isSvg(undefined)).toBe(false);
      expect(undefined).toBeUndefined();
    });
  });
});
