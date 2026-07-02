import {
  assertSvgPipelineFormats,
  classifyInputFiles,
  filterInputFilesByMode,
  resolveWebfontConversionFormats,
} from "./inputMode";

describe("classifyInputFiles", () => {
  it("should return empty when no files are provided", () => {
    expect(classifyInputFiles([])).toBe("empty");
  });

  it("should classify svg-only globs as svg mode", () => {
    expect(classifyInputFiles(["src/fixtures/svg-icons/avatar.svg"])).toBe("svg");
  });

  it("should classify woff-only globs as webfont mode", () => {
    expect(classifyInputFiles(["src/fixtures/fonts/iconfont.woff"])).toBe("webfont");
  });

  it("should classify woff2-only globs as webfont mode", () => {
    expect(classifyInputFiles(["src/fixtures/fonts/iconfont.woff2"])).toBe("webfont");
  });

  it("should classify mixed woff and woff2 as webfont mode", () => {
    expect(classifyInputFiles(["src/fixtures/fonts/iconfont.woff", "src/fixtures/fonts/iconfont.woff2"])).toBe(
      "webfont",
    );
  });

  it("should reject mixed svg and webfont inputs", () => {
    expect(classifyInputFiles(["src/fixtures/svg-icons/avatar.svg", "src/fixtures/fonts/iconfont.woff2"])).toBe(
      "mixed",
    );
  });

  it("should return empty for unsupported extensions", () => {
    expect(classifyInputFiles(["readme.txt"])).toBe("empty");
  });

  it("should return empty when extension-less files are mixed with webfont inputs", () => {
    expect(classifyInputFiles(["LICENSE", "src/fixtures/fonts/iconfont.woff2"])).toBe("empty");
    expect(classifyInputFiles([".webfontrc", "src/fixtures/fonts/iconfont.woff2"])).toBe("empty");
  });

  it("should return empty for extension-less files only", () => {
    expect(classifyInputFiles(["LICENSE", ".webfontrc"])).toBe("empty");
  });
});

describe("assertSvgPipelineFormats", () => {
  it("should reject otf output requests in the svg pipeline", () => {
    expect(() => assertSvgPipelineFormats(["otf"])).toThrow(
      'OTF output is only supported when converting WOFF/WOFF2 input. Request "ttf" for SVG icons, or pass a .woff/.woff2 file.',
    );
    expect(() => assertSvgPipelineFormats(["svg", "otf", "woff2"])).toThrow(
      'OTF output is only supported when converting WOFF/WOFF2 input. Request "ttf" for SVG icons, or pass a .woff/.woff2 file.',
    );
  });

  it("should allow svg pipeline formats without otf", () => {
    expect(() => assertSvgPipelineFormats(["svg", "ttf", "eot", "woff", "woff2"])).not.toThrow();
    expect(() => assertSvgPipelineFormats(["woff2"])).not.toThrow();
  });
});

describe("filterInputFilesByMode", () => {
  it("should filter svg files in svg mode", () => {
    expect(filterInputFilesByMode(["src/fixtures/svg-icons/avatar.svg", "ignored.woff"], "svg")).toEqual([
      "src/fixtures/svg-icons/avatar.svg",
    ]);
  });

  it("should filter webfont files in webfont mode", () => {
    expect(
      filterInputFilesByMode(
        ["src/fixtures/fonts/iconfont.woff2", "src/fixtures/svg-icons/avatar.svg"],
        "webfont",
      ),
    ).toEqual(["src/fixtures/fonts/iconfont.woff2"]);
  });

  it("should return an empty list for unsupported modes", () => {
    expect(filterInputFilesByMode(["src/fixtures/fonts/iconfont.woff2"], "empty")).toEqual([]);
  });
});

describe("resolveWebfontConversionFormats", () => {
  it("should default to ttf when svg pipeline formats are still configured", () => {
    expect(resolveWebfontConversionFormats(["svg", "ttf", "eot", "woff", "woff2"])).toEqual(["ttf"]);
  });

  it("should keep explicit ttf or otf requests when svg pipeline formats are present", () => {
    expect(resolveWebfontConversionFormats(["svg", "otf", "woff2"])).toEqual(["otf"]);
  });

  it("should deduplicate explicit conversion formats", () => {
    expect(resolveWebfontConversionFormats(["ttf", "ttf", "otf"])).toEqual(["ttf", "otf"]);
  });

  it("should reject conversion runs without ttf or otf output formats", () => {
    expect(() => resolveWebfontConversionFormats(["woff2"])).toThrow(
      'formats must include "ttf" and/or "otf" when converting WOFF/WOFF2 input',
    );
  });
});
