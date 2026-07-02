import type { Format, Formats } from "../types/Format";

export const VALID_FORMATS = new Set<Format>(["eot", "otf", "svg", "ttf", "woff", "woff2"]);

export const VALID_FORMATS_LIST = [...VALID_FORMATS].join(", ");

export const assertValidFormat = (value: unknown): Format => {
  if (typeof value !== "string" || !VALID_FORMATS.has(value as Format)) {
    throw new Error(`Invalid format "${String(value)}". Expected one of: ${VALID_FORMATS_LIST}`);
  }

  return value as Format;
};

export const parseFormatsList = (values: readonly unknown[]): Formats => {
  if (values.length === 0) {
    throw new Error("formats must not be empty");
  }

  return values.map(assertValidFormat);
};

export const assertFormatsOption = (formats: unknown): Formats => {
  if (!Array.isArray(formats)) {
    throw new Error('formats must be an array of format names (e.g. ["woff2", "svg"])');
  }

  return parseFormatsList(formats);
};
