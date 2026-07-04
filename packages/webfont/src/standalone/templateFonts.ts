import type { Format } from "../types/Format";
import type { Result } from "../types/Result";

export const getTemplateFontBase64 = (format: Format, result: Result): string => {
  if (format === "woff2") {
    if (!result.woff2) {
      throw new Error(`Missing woff2 buffer for template rendering`);
    }

    return Buffer.from(result.woff2).toString("base64");
  }

  const fontBuffer = result[format];

  if (!fontBuffer) {
    throw new Error(`Missing ${format} buffer for template rendering`);
  }

  return fontBuffer.toString("base64");
};
