import type { Format } from "@webfont/types/Format";

export type FormatMode = "recommended-fast" | "custom";

/** Recommended browser output without WOFF2 (avoids WASM compress during conversion). */
export const RECOMMENDED_FAST_FORMATS: Format[] = ["svg", "ttf", "woff"];

/** Formats offered when the user picks formats manually. */
export const CUSTOM_FORMAT_OPTIONS: Format[] = ["svg", "ttf", "woff", "woff2"];

export const FORMAT_LABELS: Record<Format, string> = {
  svg: "SVG font",
  ttf: "TTF",
  woff: "WOFF",
  woff2: "WOFF2",
  eot: "EOT",
  otf: "OTF",
};

export const formatListLabel = (formats: readonly Format[]): string =>
  formats.map((format) => FORMAT_LABELS[format] ?? format.toUpperCase()).join(", ");
