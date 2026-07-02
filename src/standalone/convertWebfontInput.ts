import fontverter from "fontverter";
import * as fsPromise from "fs/promises";
import { getSfntFlavor } from "../lib/sfnt/flavor";
import type { Result } from "../types/Result";
import type { WebfontOptions } from "../types/WebfontOptions";
import { type ConversionFormat, resolveWebfontConversionFormats } from "./inputMode";

const assertSingleFontFile = (fontFiles: readonly string[]): string => {
  if (fontFiles.length === 0) {
    throw new Error("No WOFF or WOFF2 files matched");
  }

  if (fontFiles.length > 1) {
    throw new Error("WOFF/WOFF2 conversion supports one font file at a time");
  }

  return fontFiles[0];
};

const assertConversionOptions = (options: WebfontOptions): void => {
  if (options.template) {
    throw new Error("Templates are not supported when converting WOFF/WOFF2 input");
  }

  if (options.glyphTransformFn) {
    throw new Error("glyphTransformFn is not supported when converting WOFF/WOFF2 input");
  }
};

const assignSfntOutput = (
  result: Result,
  sfnt: Buffer,
  format: ConversionFormat,
  flavor: ReturnType<typeof getSfntFlavor>,
): void => {
  if (format === "ttf" && flavor !== "ttf") {
    throw new Error('Input decompresses to OpenType (OTF). Request "otf" format instead of "ttf".');
  }

  if (format === "otf" && flavor !== "otf") {
    throw new Error('Input decompresses to TrueType (TTF). Request "ttf" format instead of "otf".');
  }

  if (format === "ttf") {
    result.ttf = sfnt;
    return;
  }

  result.otf = sfnt;
};

export const convertWebfontInput = async (
  fontFiles: readonly string[],
  options: WebfontOptions,
): Promise<Result> => {
  assertConversionOptions(options);

  const fontPath = assertSingleFontFile(fontFiles);
  const inputBuffer = await fsPromise.readFile(fontPath);

  if (options.verbose) {
    // biome-ignore lint/suspicious/noConsole: verbose conversion progress
    console.log(`Decompressing ${fontPath}...`);
  }

  const sfnt = Buffer.from(await fontverter.convert(inputBuffer, "sfnt"));
  const flavor = getSfntFlavor(sfnt);
  const formats = resolveWebfontConversionFormats(options.formats);
  const result: Result = {
    config: { ...options },
  };

  for (const format of formats) {
    assignSfntOutput(result, sfnt, format, flavor);
  }

  return result;
};
