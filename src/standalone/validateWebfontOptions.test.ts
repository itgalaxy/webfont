import type { WebfontOptions } from "../types/WebfontOptions";
import { validateWebfontOptions } from "./validateWebfontOptions";

const baseOptions = (): WebfontOptions =>
  ({
    files: "icons/*.svg",
    fontName: "webfont",
    formats: ["woff2"],
    centerHorizontally: false,
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
});
