import fontverter from "fontverter";
import * as fsPromise from "fs/promises";
import { isHttpUrl } from "../lib/inputSource";
import { getSfntFlavor } from "../lib/sfnt/flavor";
import type { DecompressedFont } from "../types/DecompressedFont";
import type { Result } from "../types/Result";
import type { WebfontOptions } from "../types/WebfontOptions";
import { fetchWebfontFromUrl } from "./fetchWebfontUrl";
import { type ConversionFormat, resolveWebfontConversionFormats } from "./inputMode";

const assertNonEmptyFontFiles = (fontFiles: readonly string[]): void => {
  if (fontFiles.length === 0) {
    throw new Error("No WOFF or WOFF2 files matched");
  }
};

const assertConversionOptions = (options: WebfontOptions): void => {
  if (options.template) {
    throw new Error("Templates are not supported when converting WOFF/WOFF2 input");
  }

  if (options.glyphTransformFn) {
    throw new Error("glyphTransformFn is not supported when converting WOFF/WOFF2 input");
  }

  if (options.glyphContentTransformFn) {
    throw new Error("glyphContentTransformFn is not supported when converting WOFF/WOFF2 input");
  }
};

type AssignSfntOutputOptions = {
  decompressed: DecompressedFont;
  sfnt: Buffer;
  format: ConversionFormat;
  flavor: ReturnType<typeof getSfntFlavor>;
  source: string;
};

const assignSfntOutput = (options: AssignSfntOutputOptions): void => {
  const { decompressed, sfnt, format, flavor, source } = options;

  if (format === "ttf" && flavor !== "ttf") {
    throw new Error(`Input decompresses to OpenType (OTF). Request "otf" format instead of "ttf" for ${source}.`);
  }

  if (format === "otf" && flavor !== "otf") {
    throw new Error(`Input decompresses to TrueType (TTF). Request "ttf" format instead of "otf" for ${source}.`);
  }

  if (format === "ttf") {
    decompressed.ttf = sfnt;
    return;
  }

  decompressed.otf = sfnt;
};

const readWebfontInput = (source: string): Promise<Buffer> => {
  if (isHttpUrl(source)) {
    return fetchWebfontFromUrl(source);
  }

  return fsPromise.readFile(source);
};

const decompressWebfontSource = async (
  source: string,
  formats: ConversionFormat[],
  verbose?: boolean,
): Promise<DecompressedFont> => {
  if (verbose) {
    // biome-ignore lint/suspicious/noConsole: verbose conversion progress
    console.log(`Decompressing ${source}...`);
  }

  const inputBuffer = await readWebfontInput(source);
  const sfnt = Buffer.from(await fontverter.convert(inputBuffer, "sfnt"));
  const flavor = getSfntFlavor(sfnt);
  const decompressed: DecompressedFont = { source };

  for (const format of formats) {
    assignSfntOutput({ decompressed, sfnt, format, flavor, source });
  }

  return decompressed;
};

export const convertWebfontInput = async (
  fontFiles: readonly string[],
  options: WebfontOptions,
): Promise<Result> => {
  assertConversionOptions(options);
  assertNonEmptyFontFiles(fontFiles);

  const formats = resolveWebfontConversionFormats(options.formats);
  const decompressedFonts = await Promise.all(
    fontFiles.map((source) => decompressWebfontSource(source, formats, options.verbose)),
  );

  const result: Result = {
    config: { ...options },
    decompressedFonts,
  };

  if (decompressedFonts.length === 1) {
    result.ttf = decompressedFonts[0].ttf;
    result.otf = decompressedFonts[0].otf;
  }

  return result;
};
