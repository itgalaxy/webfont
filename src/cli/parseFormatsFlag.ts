import type { Format, Formats } from "../types/Format";

const VALID_FORMATS = new Set<Format>(["eot", "svg", "ttf", "woff", "woff2"]);

const assertValidFormat = (value: unknown): Format => {
  if (typeof value !== "string" || !VALID_FORMATS.has(value as Format)) {
    throw new Error(`Invalid format "${String(value)}". Expected one of: ${[...VALID_FORMATS].join(", ")}`);
  }

  return value as Format;
};

export const parseFormatsFlag = (value: string): Formats => {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed: unknown = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      throw new Error("formats must be a JSON array");
    }

    return parsed.map(assertValidFormat);
  }

  if (trimmed.length === 0) {
    throw new Error("formats must not be empty");
  }

  return trimmed.split(",").map((format) => assertValidFormat(format.trim()));
};
