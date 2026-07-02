import { getOptions } from "./options";

describe("options", () => {
  it("should throw when files is not passed", () => {
    expect(() => getOptions()).toThrow("You must pass webfont a `files` glob");
    expect(() => getOptions({} as never)).toThrow("You must pass webfont a `files` glob");
  });

  it("should return default webfont options", () => {
    const options = getOptions({ files: "icons/*.svg" });

    expect(options.files).toBe("icons/*.svg");
    expect(options.fontName).toBe("webfont");
    expect(options.formats).toEqual(["svg", "ttf", "eot", "woff", "woff2"]);
    expect(options.maxConcurrency).toBe(100);
    expect(options.metadataProvider).toBeNull();
    expect(options.templateFontPath).toBe("./");
    expect(options.ligatures).toBe(true);
    expect(options.sort).toBe(true);
    expect(options.verbose).toBe(false);
    expect(options.fontHeight).toBeUndefined();
    expect(options.template).toBeUndefined();
  });

  it("should merge initial options over defaults", () => {
    const options = getOptions({
      files: ["a.svg"],
      fontName: "custom",
      formats: ["woff2"],
      ligatures: false,
      template: "css",
      verbose: true,
      metadata: "test-meta",
    });

    expect(options.files).toEqual(["a.svg"]);
    expect(options.fontName).toBe("custom");
    expect(options.formats).toEqual(["woff2"]);
    expect(options.ligatures).toBe(false);
    expect(options.template).toBe("css");
    expect(options.verbose).toBe(true);
    expect(options.metadata).toBe("test-meta");
  });
});
