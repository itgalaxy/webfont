import { parseFormatsFlag } from "./parseFormatsFlag";

describe("parseFormatsFlag", () => {
  it("should parse otf as a valid format", () => {
    expect(parseFormatsFlag("otf")).toEqual(["otf"]);
    expect(parseFormatsFlag('["ttf", "otf"]')).toEqual(["ttf", "otf"]);
  });

  it("should parse JSON array flags", () => {
    expect(parseFormatsFlag('["woff2"]')).toEqual(["woff2"]);
    expect(parseFormatsFlag('["svg", "ttf", "eot"]')).toEqual(["svg", "ttf", "eot"]);
  });

  it("should parse comma-separated flags", () => {
    expect(parseFormatsFlag("woff2")).toEqual(["woff2"]);
    expect(parseFormatsFlag("svg, ttf, woff2")).toEqual(["svg", "ttf", "woff2"]);
  });

  it("should reject invalid format names", () => {
    expect(() => parseFormatsFlag('["not-a-format"]')).toThrow('Invalid format "not-a-format"');
    expect(() => parseFormatsFlag("woff2, bad")).toThrow('Invalid format "bad"');
  });

  it("should reject non-array JSON values", () => {
    expect(() => parseFormatsFlag('{"formats":["woff2"]}')).toThrow("formats must be a JSON array");
  });

  it("should reject empty comma-separated values", () => {
    expect(() => parseFormatsFlag("")).toThrow("formats must not be empty");
    expect(() => parseFormatsFlag("   ")).toThrow("formats must not be empty");
  });
});
