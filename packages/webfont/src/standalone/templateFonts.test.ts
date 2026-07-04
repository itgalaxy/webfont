import type { Result } from "../types/Result";
import { getTemplateFontBase64 } from "./templateFonts";

describe("templateFonts", () => {
  const sampleBuffer = Buffer.from("font-data");

  it("should encode woff2 buffer as base64", () => {
    const result: Result = {
      woff2: sampleBuffer,
    };

    expect(getTemplateFontBase64("woff2", result)).toBe(sampleBuffer.toString("base64"));
  });

  it("should throw when woff2 buffer is missing", () => {
    expect(() => getTemplateFontBase64("woff2", {})).toThrow("Missing woff2 buffer for template rendering");
  });

  it("should encode svg buffer as base64", () => {
    const result: Result = {
      svg: sampleBuffer,
    };

    expect(getTemplateFontBase64("svg", result)).toBe(sampleBuffer.toString("base64"));
  });

  it.each(["svg", "ttf", "eot", "woff"] as const)("should throw when %s buffer is missing", (format) => {
    expect(() => getTemplateFontBase64(format, {})).toThrow(`Missing ${format} buffer for template rendering`);
  });
});
