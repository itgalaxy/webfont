import isTtf from "is-ttf";
import isWoff2 from "is-woff2";
import svg2ttf from "svg2ttf";
import standalone from "../standalone";

jest.mock("svg2ttf", () => jest.fn(jest.requireActual("svg2ttf")));

const mockedSvg2ttf = svg2ttf as jest.MockedFunction<typeof svg2ttf>;

const fixturesGlob = "src/fixtures";
const svgIconsGlob = `${fixturesGlob}/svg-icons`;
const badSvgFile = `${fixturesGlob}/bad-svg-icons/avatar.svg`;

const getSvgFontString = async (): Promise<string> => {
  const result = await standalone({
    files: `${svgIconsGlob}/avatar.svg`,
    formats: ["svg"],
  });

  if (!result.svg) {
    throw new Error("Expected svg font output from standalone");
  }

  return result.svg.toString();
};

describe("svg2ttf output validation", () => {
  beforeEach(() => {
    mockedSvg2ttf.mockClear();
    mockedSvg2ttf.mockImplementation(jest.requireActual("svg2ttf"));
  });

  describe("svg2ttf library contract (production dependency)", () => {
    it("should document that svg2ttf depends on @xmldom/xmldom for svg font parsing", () => {
      const svg2ttfPackage = jest.requireActual<{ dependencies: Record<string, string> }>("svg2ttf/package.json");

      expect(svg2ttfPackage.dependencies["@xmldom/xmldom"]).toBeDefined();
    });

    it("should document that svg2ttf rejects empty svg font input", () => {
      expect(() => svg2ttf("", {})).toThrow();
    });

    it("should document that svg2ttf rejects regular svg images without a font element", () => {
      expect(() => svg2ttf('<svg xmlns="http://www.w3.org/2000/svg"><path /></svg>', {})).toThrow(
        /Can't find <font> tag/u,
      );
    });

    it("should document that svg2ttf rejects malformed svg font markup", () => {
      expect(() => svg2ttf("<font><unclosed>", {})).toThrow();
    });

    it("should document that svg2ttf rejects non-string version options", async () => {
      const svgFont = await getSvgFontString();

      expect(() => svg2ttf(svgFont, { version: 1 })).toThrow(/version option should be a string/u);
    });

    it("should document that svg2ttf rejects invalid version strings", async () => {
      const svgFont = await getSvgFontString();

      expect(() => svg2ttf(svgFont, { version: "bad" })).toThrow(/invalid option, version/u);
    });

    it("should accept a webfont-generated svg font and returns a ttf buffer", async () => {
      const svgFont = await getSvgFontString();
      const ttf = svg2ttf(svgFont, { version: "1.0" });

      expect(ttf.buffer.byteLength).toBeGreaterThan(0);
      expect(isTtf(Buffer.from(ttf.buffer))).toBe(true);
    });
  });

  describe("webfont result.ttf validation", () => {
    it("should accept ttf font output from standalone as valid ttf", async () => {
      const result = await standalone({
        files: `${svgIconsGlob}/avatar.svg`,
        formats: ["ttf"],
      });

      expect(result.ttf).toBeDefined();
      expect(isTtf(result.ttf)).toBe(true);
      expect(mockedSvg2ttf).toHaveBeenCalled();
    });

    it("should forward every formatsOptions.ttf field to svg2ttf", async () => {
      const ttfOptions = {
        copyright: "test copyright",
        description: "test description",
        ts: 1457357570,
        url: "https://example.com/fonts",
        version: "2.0",
      };

      await standalone({
        files: `${svgIconsGlob}/avatar.svg`,
        formats: ["ttf"],
        formatsOptions: {
          ttf: ttfOptions,
        },
      });

      expect(mockedSvg2ttf).toHaveBeenCalledWith(expect.any(String), ttfOptions);
    });

    it("should run svg2ttf internally even when ttf is omitted from formats", async () => {
      const result = await standalone({
        files: `${svgIconsGlob}/avatar.svg`,
        formats: ["woff2"],
      });

      expect(result.ttf).toBeUndefined();
      expect(result.woff2).toBeDefined();
      expect(isWoff2(result.woff2)).toBe(true);
      expect(mockedSvg2ttf).toHaveBeenCalled();
    });

    it("should not emit result.ttf when only woff and woff2 are requested", async () => {
      const result = await standalone({
        files: `${svgIconsGlob}/avatar.svg`,
        formats: ["woff", "woff2"],
      });

      expect(result.ttf).toBeUndefined();
      expect(result.woff).toBeDefined();
      expect(result.woff2).toBeDefined();
      expect(mockedSvg2ttf).toHaveBeenCalled();
    });

    it("should document that absent result.ttf must be asserted with toBeUndefined, not is-ttf", () => {
      // is-ttf coerces missing values to false, which cannot distinguish "not generated" from "invalid".
      expect(isTtf(undefined)).toBe(false);
      expect(undefined).toBeUndefined();
    });

    it("should reject invalid input svg before svg2ttf is called", async () => {
      await expect(
        standalone({
          files: badSvgFile,
        }),
      ).rejects.toThrow(/Unclosed root tag/u);

      expect(mockedSvg2ttf).not.toHaveBeenCalled();
    });
  });
});
