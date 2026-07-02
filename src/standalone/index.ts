import { cosmiconfig } from "cosmiconfig";
import crypto from "crypto";
import deepmerge from "deepmerge";
import nunjucks from "nunjucks";
import path from "path";
import { Readable } from "stream";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import { getBuiltInTemplates, getTemplateFilePath } from "../../templates";
import { resolveInputSources } from "../lib/inputSource";
import { getFontStreamOptions, SVGIcons2SVGFontStream } from "../lib/svgicons2svgfont";
import convertTtfToEot from "../lib/ttf2eot";
import type { Format, GlyphData, GlyphMetadata, InitialOptions, WebfontOptions } from "../types";
import type { Result } from "../types/Result";
import type { ResultConfig } from "../types/ResultConfig";
import { convertWebfontInput } from "./convertWebfontInput";
import { getGlyphsData } from "./glyphsData";
import { assertSvgPipelineFormats, classifyInputFiles, filterInputFilesByMode } from "./inputMode";
import { getOptions } from "./options";
import { getTemplateFontBase64 } from "./templateFonts";
import toTtf from "./toTtf";

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

const toEot = (buffer: Buffer) => convertTtfToEot(buffer);

const toWoff = (buffer: Buffer, options: { metadata?: string }) => Buffer.from(ttf2woff(buffer, options).buffer);

const toWoff2 = (buffer: Buffer) => wawoff2.compress(buffer);

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

  let filePatterns: string[];

  if (Array.isArray(options.files)) {
    filePatterns = options.files;
  } else {
    filePatterns = [options.files];
  }

  const foundFiles = await resolveInputSources(filePatterns);
  const inputMode = classifyInputFiles(foundFiles);

  if (inputMode === "mixed") {
    throw new Error("Cannot mix SVG icons with WOFF/WOFF2 font files in the same run");
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

  assertSvgPipelineFormats(options.formats);

  const filteredFiles = filterInputFilesByMode(foundFiles, "svg");

  let glyphsData = (await getGlyphsData(filteredFiles, options)) as GlyphData[];

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
    const builtInTemplates = getBuiltInTemplates();

    let templateFilePath: string;

    if (Object.keys(builtInTemplates).includes(options.template)) {
      result.usedBuildInTemplate = true;

      const builtInPath = path.resolve(__dirname, "../..");
      nunjucks.configure(builtInPath);
      templateFilePath = getTemplateFilePath(options.template);
    } else {
      const resolvedTemplateFilePath = path.resolve(options.template);

      nunjucks.configure(path.dirname(resolvedTemplateFilePath));
      templateFilePath = path.resolve(resolvedTemplateFilePath);
    }

    let hashOption = {};

    if (options.addHashInFontUrl) {
      hashOption = { hash: result.hash };
    }

    const nunjucksOptions = deepmerge.all([
      {
        glyphs: result.glyphsData?.map((glyph: GlyphData) => glyph.metadata) ?? [],
      },
      options,
      {
        cacheString: options.templateCacheString || Date.now(),
        className: options.templateClassName || options.fontName,
        fontName: options.templateFontName || options.fontName,
        fontPath: options.templateFontPath.replace(/\/?$/u, "/"),
      },
      hashOption,
      {
        fonts: Object.fromEntries(
          new Map(formats.map((format: Format) => [format, () => getTemplateFontBase64(format, result)])),
        ),
      },
    ]);

    result.template = nunjucks.render(templateFilePath, nunjucksOptions);
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
