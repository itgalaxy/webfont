import { parseTemplateFlag } from "./parseTemplateFlag";

describe("parseTemplateFlag", () => {
  it("should parse a single built-in template", () => {
    expect(parseTemplateFlag("css")).toBe("css");
  });

  it("should parse JSON array templates (#158)", () => {
    expect(parseTemplateFlag('["html","scss"]')).toEqual(["html", "scss"]);
  });

  it("should parse comma-separated templates", () => {
    expect(parseTemplateFlag("html, scss")).toEqual(["html", "scss"]);
  });

  it("should reject non-array JSON values", () => {
    expect(() => parseTemplateFlag('{"template":"css"}')).toThrow("template must be a JSON array");
  });
});
