import type { WebfontOptions } from "../types/WebfontOptions";
import { validateWebfontOptions } from "./validateWebfontOptions";

const baseOptions = (): WebfontOptions =>
  ({
    files: "icons/*.svg",
    fontName: "webfont",
    formats: ["woff2"],
    centerHorizontally: false,
    centerVertically: false,
    descent: 0,
    fixedWidth: false,
    fontStyle: "normal",
    fontWeight: "normal",
    formatsOptions: {},
    ligatures: true,
    maxConcurrency: 100,
    metadata: {},
    normalize: true,
    prependUnicode: false,
    round: 0,
    sort: true,
    templateFontPath: "./",
    verbose: false,
  }) as WebfontOptions;

describe("validateWebfontOptions", () => {
  it("should accept valid merged options", () => {
    expect(validateWebfontOptions(baseOptions()).formats).toEqual(["woff2"]);
  });

  it("should reject unknown format names from config or API (#133)", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        formats: ["icon"],
      }),
    ).toThrow('Invalid format "icon". Expected one of: eot, otf, svg, ttf, woff, woff2');
  });

  it("should reject formats that are not an array", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        formats: "woff2" as never,
      }),
    ).toThrow('formats must be an array of format names (e.g. ["woff2", "svg"])');
  });

  it("should reject empty formats", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        formats: [],
      }),
    ).toThrow("formats must not be empty");
  });

  it("should reject empty files", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        files: "",
      }),
    ).toThrow("files must not be empty");
  });

  it("should reject non-string fontName", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        fontName: 42 as never,
      }),
    ).toThrow("fontName must be a string");
  });

  it("should reject invalid unicodeRange option types", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        unicodeRange: 123 as never,
      }),
    ).toThrow("unicodeRange must be a boolean or string");
  });

  it("should reject invalid optimizeSvg and svgoConfig option types", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        optimizeSvg: "yes" as never,
      }),
    ).toThrow("optimizeSvg must be a boolean");

    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        svgoConfig: "invalid" as never,
      }),
    ).toThrow("svgoConfig must be an object");
  });

  it("should reject invalid templateFontLigatures option types", () => {
    expect(() =>
      validateWebfontOptions({
        ...baseOptions(),
        templateFontLigatures: "yes" as never,
      }),
    ).toThrow("templateFontLigatures must be a boolean");
  });

  it("should accept template as an array (#158)", () => {
    expect(
      validateWebfontOptions({
        ...baseOptions(),
        template: ["html", "scss"],
      }).template,
    ).toEqual(["html", "scss"]);
  });
});
