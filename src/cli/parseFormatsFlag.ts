import { assertValidFormat, parseFormatsList } from "../lib/parseFormats";
import type { Formats } from "../types/Format";

export const parseFormatsFlag = (value: string | undefined): Formats | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error("formats must not be empty");
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('formats must be a JSON array (e.g. ["woff2","svg"]) or comma-separated list');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('formats must be a JSON array (e.g. ["woff2","svg"]) or comma-separated list');
    }

    return parseFormatsList(parsed);
  }

  return trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(assertValidFormat);
};
