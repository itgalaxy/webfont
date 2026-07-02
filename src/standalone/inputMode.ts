import { getInputExtension } from "../lib/inputSource";
import type { Format } from "../types/Format";

export type InputMode = "empty" | "mixed" | "svg" | "webfont";

const WEBFONT_EXTENSIONS = new Set([".woff", ".woff2"]);
const SVG_EXTENSION = ".svg";
const SVG_PIPELINE_DEFAULT: Format[] = ["svg", "ttf", "eot", "woff", "woff2"];

const isSvgExtension = (extension: string): boolean => extension === SVG_EXTENSION;
const isWebfontExtension = (extension: string): boolean => WEBFONT_EXTENSIONS.has(extension);
const isSupportedInputExtension = (extension: string): boolean =>
  isSvgExtension(extension) || isWebfontExtension(extension);

export const classifyInputFiles = (filePaths: readonly string[]): InputMode => {
  if (filePaths.length === 0) {
    return "empty";
  }

  const extensions = filePaths.map((filePath) => getInputExtension(filePath));

  if (!extensions.every(isSupportedInputExtension)) {
    return "empty";
  }

  const hasSvg = extensions.some(isSvgExtension);
  const hasWebfont = extensions.some(isWebfontExtension);

  if (hasSvg && hasWebfont) {
    return "mixed";
  }

  if (hasWebfont) {
    return "webfont";
  }

  if (hasSvg) {
    return "svg";
  }

  return "empty";
};

export const assertSvgPipelineFormats = (formats: readonly Format[]): void => {
  if (formats.includes("otf")) {
    throw new Error(
      'OTF output is only supported when converting WOFF/WOFF2 input. Request "ttf" for SVG icons, or pass a .woff/.woff2 file.',
    );
  }
};

export const filterInputFilesByMode = (filePaths: readonly string[], mode: InputMode): string[] => {
  if (mode === "svg") {
    return filePaths.filter((filePath) => getInputExtension(filePath) === SVG_EXTENSION);
  }

  if (mode === "webfont") {
    return filePaths.filter((filePath) => WEBFONT_EXTENSIONS.has(getInputExtension(filePath)));
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
