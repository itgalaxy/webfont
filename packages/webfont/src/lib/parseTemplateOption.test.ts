import { normalizeTemplateOption } from "./parseTemplateOption";

describe("normalizeTemplateOption", () => {
  it("should accept a single template name", () => {
    expect(normalizeTemplateOption("css")).toEqual(["css"]);
  });

  it("should accept multiple template names (#158)", () => {
    expect(normalizeTemplateOption(["html", "scss"])).toEqual(["html", "scss"]);
  });

  it("should reject empty template arrays", () => {
    expect(() => normalizeTemplateOption([])).toThrow("template must not be empty");
  });

  it("should reject non-string template entries", () => {
    expect(() => normalizeTemplateOption(["css", 1 as never])).toThrow(
      "template must be a string or an array of non-empty strings",
    );
  });
});
