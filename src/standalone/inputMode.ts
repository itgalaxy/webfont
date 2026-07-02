import path from "path";
import type { Format } from "../types/Format";

export type InputMode = "empty" | "mixed" | "svg" | "webfont";

const WEBFONT_EXTENSIONS = new Set([".woff", ".woff2"]);
const SVG_EXTENSION = ".svg";
const SVG_PIPELINE_DEFAULT: Format[] = ["svg", "ttf", "eot", "woff", "woff2"];

export const classifyInputFiles = (filePaths: readonly string[]): InputMode => {
  if (filePaths.length === 0) {
    return "empty";
  }

  const extensions = new Set(filePaths.map((filePath) => path.extname(filePath).toLowerCase()));
  const hasSvg = extensions.has(SVG_EXTENSION);
  const hasWebfont = [...extensions].some((extension) => WEBFONT_EXTENSIONS.has(extension));
  const hasOnlyWebfont = [...extensions].every(
    (extension) => extension === "" || WEBFONT_EXTENSIONS.has(extension),
  );
  const hasOnlySvg = [...extensions].every((extension) => extension === "" || extension === SVG_EXTENSION);

  if (hasSvg && hasWebfont) {
    return "mixed";
  }

  if (hasWebfont && hasOnlyWebfont) {
    return "webfont";
  }

  if (hasSvg && hasOnlySvg) {
    return "svg";
  }

  return "empty";
};

export const filterInputFilesByMode = (filePaths: readonly string[], mode: InputMode): string[] => {
  if (mode === "svg") {
    return filePaths.filter((filePath) => path.extname(filePath).toLowerCase() === SVG_EXTENSION);
  }

  if (mode === "webfont") {
    return filePaths.filter((filePath) => WEBFONT_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
  }

  return [];
};

export type ConversionFormat = "otf" | "ttf";

export const resolveWebfontConversionFormats = (formats: readonly Format[]): ConversionFormat[] => {
  const ttfOrOtf = formats.filter((format): format is "otf" | "ttf" => format === "ttf" || format === "otf");
  const isFullSvgDefault =
    formats.length === SVG_PIPELINE_DEFAULT.length &&
    SVG_PIPELINE_DEFAULT.every((format) => formats.includes(format));

  if (isFullSvgDefault) {
    return ["ttf"];
  }

  if (ttfOrOtf.length === 0) {
    throw new Error('formats must include "ttf" and/or "otf" when converting WOFF/WOFF2 input');
  }

  return [...new Set(ttfOrOtf)];
};
