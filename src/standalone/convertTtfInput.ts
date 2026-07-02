import * as fsPromise from "fs/promises";
import { isHttpUrl } from "../lib/inputSource";
import { getSfntFlavor } from "../lib/sfnt/flavor";
import { encodeTtfToEot, encodeTtfToWoff, encodeTtfToWoff2 } from "../lib/ttfEncode";
import type { Result } from "../types/Result";
import type { TranscodedFont } from "../types/TranscodedFont";
import type { WebfontOptions } from "../types/WebfontOptions";
import { resolveTtfConversionFormats, type TtfEncodeFormat } from "./inputMode";

const assertNonEmptyFontFiles = (fontFiles: readonly string[]): void => {
  if (fontFiles.length === 0) {
    throw new Error("No TTF files matched");
  }
};

const assertConversionOptions = (options: WebfontOptions): void => {
  if (options.template) {
    throw new Error("Templates are not supported when converting TTF input");
  }

  if (options.glyphTransformFn) {
    throw new Error("glyphTransformFn is not supported when converting TTF input");
  }

  if (options.glyphContentTransformFn) {
    throw new Error("glyphContentTransformFn is not supported when converting TTF input");
  }
};

const assertValidTtfInput = (buffer: Buffer, source: string): void => {
  let flavor: ReturnType<typeof getSfntFlavor>;

  try {
    flavor = getSfntFlavor(buffer);
  } catch {
    throw new Error(`Input is not a valid TrueType font: ${source}`);
  }

  if (flavor !== "ttf") {
    throw new Error(`OpenType (OTF) input is not supported for webfont encoding. Use a .ttf file for ${source}.`);
  }
};

const assignTtfOutput = async (
  transcoded: TranscodedFont,
  buffer: Buffer,
  format: TtfEncodeFormat,
  options: WebfontOptions,
): Promise<void> => {
  if (format === "ttf") {
    transcoded.ttf = buffer;
    return;
  }

  if (format === "eot") {
    transcoded.eot = encodeTtfToEot(buffer);
    return;
  }

  if (format === "woff") {
    let metadata: string | undefined;

    if (typeof options.metadata === "string") {
      metadata = options.metadata;
    }

    transcoded.woff = encodeTtfToWoff(buffer, { metadata });
    return;
  }

  transcoded.woff2 = await encodeTtfToWoff2(buffer);
};

const transcodeTtfSource = async (
  source: string,
  formats: TtfEncodeFormat[],
  options: WebfontOptions,
  verbose?: boolean,
): Promise<TranscodedFont> => {
  if (isHttpUrl(source)) {
    throw new Error(`Remote TTF URLs are not supported. Download the file first: ${source}`);
  }

  if (verbose) {
    // biome-ignore lint/suspicious/noConsole: verbose conversion progress
    console.log(`Encoding ${source}...`);
  }

  const buffer = await fsPromise.readFile(source);

  assertValidTtfInput(buffer, source);

  const transcoded: TranscodedFont = { source };

  await Promise.all(formats.map((format) => assignTtfOutput(transcoded, buffer, format, options)));

  return transcoded;
};

export const convertTtfInput = async (fontFiles: readonly string[], options: WebfontOptions): Promise<Result> => {
  assertConversionOptions(options);
  assertNonEmptyFontFiles(fontFiles);

  const formats = resolveTtfConversionFormats(options.formats);
  const transcodedFonts = await Promise.all(
    fontFiles.map((source) => transcodeTtfSource(source, formats, options, options.verbose)),
  );

  const result: Result = {
    config: { ...options },
    transcodedFonts,
  };

  if (transcodedFonts.length === 1) {
    const [single] = transcodedFonts;

    result.ttf = single.ttf;
    result.eot = single.eot;
    result.woff = single.woff;
    result.woff2 = single.woff2;
  }

  return result;
};
