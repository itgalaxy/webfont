import index, { type Result, type ResultConfig, webfont, writeResultFiles } from ".";

describe("index", () => {
  it("should be exported", () => {
    expect(typeof index === "function").toBe(true);
  });

  it("should expose webfont as both the default and a named export", () => {
    expect(index).toBe(webfont);
  });

  it("should re-export the public Result and ResultConfig types", () => {
    expectTypeOf<Result["config"]>().toEqualTypeOf<ResultConfig | undefined>();
    expectTypeOf<ResultConfig>().toHaveProperty("filePath");
    expectTypeOf<ResultConfig["filePath"]>().toEqualTypeOf<string | undefined>();
  });

  it("should export writeResultFiles for programmatic disk writes", () => {
    expect(typeof writeResultFiles).toBe("function");
  });
});
