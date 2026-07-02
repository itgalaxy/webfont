import { cosmiconfig } from "cosmiconfig";
import crypto from "crypto";
import deepmerge from "deepmerge";
import path from "path";
import { Readable } from "stream";
import { resolveInputSources } from "../lib/inputSource";
import { getFontStreamOptions, SVGIcons2SVGFontStream } from "../lib/svgicons2svgfont";
import { encodeTtfToEot, encodeTtfToWoff, encodeTtfToWoff2 } from "../lib/ttfEncode";
import type { GlyphData, GlyphMetadata, InitialOptions, WebfontOptions } from "../types";
import type { Result } from "../types/Result";
import type { ResultConfig } from "../types/ResultConfig";
import { convertTtfInput } from "./convertTtfInput";
import { convertWebfontInput } from "./convertWebfontInput";
import { getGlyphsData } from "./glyphsData";
import { assertSvgPipelineFormats, classifyInputFiles, filterInputFilesByMode } from "./inputMode";
import { getOptions } from "./options";
import { renderTemplates } from "./renderTemplates";
import toTtf from "./toTtf";
import { validateWebfontOptions } from "./validateWebfontOptions";

type CosmiconfigLoaded = NonNullable<Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>>>;

const isCosmiconfigLoaded = (value: CosmiconfigLoaded | Record<string, never>): value is CosmiconfigLoaded =>
  "filepath" in value;

const buildConfig = async (options: {
  configFile?: string;
}): Promise<CosmiconfigLoaded | Record<string, never>> => {
  const configExplorer = cosmiconfig("webfont", {
    // v9 defaults to `none` (cwd only); keep walking up to home/stopDir like v8.
    searchStrategy: "global",
  });

  if (options.configFile) {
    const configPath = path.resolve(process.cwd(), options.configFile);
    const config = await configExplorer.load(configPath);

    return config ?? {};
  }

  const config = await configExplorer.search(process.cwd());

  return config ?? {};
};

export const loadWebfontConfig = buildConfig;

type GlyphReadable = Readable & { metadata: GlyphMetadata };

const toSvg = (glyphsData: GlyphData[], options: WebfontOptions) => {
  let result = "";

  return new Promise<string>((resolve, reject) => {
    if (options.verbose) {
      console.log("Generating SVG font...");
    }

    const fontStream = new SVGIcons2SVGFontStream(getFontStreamOptions(options))
      .on("finish", () => resolve(result))
      .on("data", (data) => {
        result += data;
      })
      .on("error", (error) => reject(error));

    glyphsData.forEach((glyphData) => {
      const glyphStream: GlyphReadable = new Readable() as GlyphReadable;

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);
      glyphStream.metadata = glyphData.metadata ?? { name: "", unicode: [] };

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
};

const toEot = (buffer: Buffer) => encodeTtfToEot(buffer);

const toWoff = (buffer: Buffer, options: { metadata?: string }) => encodeTtfToWoff(buffer, options);

const toWoff2 = (buffer: Buffer) => encodeTtfToWoff2(buffer);

type Webfont = (_initialOptions?: InitialOptions) => Promise<Result>;

export const webfont: Webfont = async (initialOptions) => {
  let options = getOptions(initialOptions);
  delete (options as Partial<ResultConfig>).filePath;

  const config = await buildConfig({
    configFile: options.configFile,
  });

  let discoveredConfigPath: string | undefined;

  if (isCosmiconfigLoaded(config)) {
    options = deepmerge(options, config.config, {
      arrayMerge: (_destinationArray, sourceArray) => sourceArray,
    });
    discoveredConfigPath = config.filepath;
  }

  options = validateWebfontOptions(options);

  let filePatterns: string[];

  if (Array.isArray(options.files)) {
    filePatterns = options.files;
  } else {
    filePatterns = [options.files];
  }

  const foundFiles = await resolveInputSources(filePatterns);
  const inputMode = classifyInputFiles(foundFiles);

  if (inputMode === "mixed") {
    throw new Error("Cannot mix SVG icons, TTF fonts, and WOFF/WOFF2 files in the same run");
  }

  if (inputMode === "empty") {
    throw new Error("Files glob patterns specified did not match any supported files");
  }

  if (inputMode === "webfont") {
    const fontFiles = filterInputFilesByMode(foundFiles, inputMode);
    const result = await convertWebfontInput(fontFiles, options);

    if (discoveredConfigPath) {
      result.config = { ...options, filePath: discoveredConfigPath };
    }

    return result;
  }

  if (inputMode === "ttf") {
    const fontFiles = filterInputFilesByMode(foundFiles, inputMode);
    const result = await convertTtfInput(fontFiles, options);

    if (discoveredConfigPath) {
      result.config = { ...options, filePath: discoveredConfigPath };
    }

    return result;
  }

  assertSvgPipelineFormats(options.formats);

  const filteredFiles = filterInputFilesByMode(foundFiles, "svg");

  let glyphsData = (await getGlyphsData(filteredFiles, options)) as GlyphData[];

  if (options.glyphContentTransformFn) {
    const glyphContentTransformFn = options.glyphContentTransformFn;
    const transformedGlyphs = glyphsData.map(async (glyphData: GlyphData) => {
      const contents = await glyphContentTransformFn(glyphData);

      return {
        ...glyphData,
        contents,
      };
    });
    glyphsData = await Promise.all(transformedGlyphs);
  }

  if (options.glyphTransformFn) {
    const glyphTransformFn = options.glyphTransformFn;
    const transformedGlyphs = glyphsData.map(async (glyphData: GlyphData) => {
      const metadata = await glyphTransformFn(glyphData.metadata ?? { name: "", unicode: [] });

      return {
        ...glyphData,
        metadata,
      };
    });
    glyphsData = await Promise.all(transformedGlyphs);
  }

  let ttfOptions = {};

  if (options.formatsOptions?.ttf) {
    ttfOptions = options.formatsOptions.ttf;
  }

  const svg = await toSvg(glyphsData, options);
  const ttf = toTtf(svg, ttfOptions);

  const result: Result = {
    glyphsData,
    hash: crypto.createHash("md5").update(svg).digest("hex"),
    svg,
    ttf,
  };

  const { formats } = options;

  if (formats.includes("eot")) {
    result.eot = toEot(ttf);
  }

  if (formats.includes("woff")) {
    let metadata: string | undefined;

    if (typeof options.metadata === "string") {
      metadata = options.metadata;
    }

    result.woff = toWoff(ttf, { metadata });
  }

  if (formats.includes("woff2")) {
    result.woff2 = Buffer.from(await toWoff2(ttf));
  }

  if (options.template) {
    const { templates, usedBuildInTemplate } = renderTemplates(options, result, formats);

    if (templates.length > 0) {
      result.templates = templates;
      result.template = templates[0]?.content;
      result.usedBuildInTemplate = usedBuildInTemplate;
    }
  }

  if (!formats.includes("svg")) {
    delete result.svg;
  }

  if (!formats.includes("ttf")) {
    delete result.ttf;
  }

  if (!formats.includes("otf")) {
    delete result.otf;
  }

  if (discoveredConfigPath) {
    result.config = { ...options, filePath: discoveredConfigPath };
  } else {
    result.config = options;
  }

  return result;
};

export default webfont;
