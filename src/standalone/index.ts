import { cosmiconfig } from "cosmiconfig";
import crypto from "crypto";
import deepmerge from "deepmerge";
import { globby } from "globby";
import nunjucks from "nunjucks";
import path from "path";
import { Readable } from "stream";
import svg2ttf from "svg2ttf";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import { getBuiltInTemplates, getTemplateFilePath } from "../../templates";
import { getFontStreamOptions, SVGIcons2SVGFontStream } from "../lib/svgicons2svgfont";
import convertTtfToEot from "../lib/ttf2eot";
import type { Format, GlyphData, GlyphMetadata, InitialOptions } from "../types";
import type { Result } from "../types/Result";
import type { ResultConfig } from "../types/ResultConfig";
import { getGlyphsData } from "./glyphsData";
import { getOptions } from "./options";

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

const toSvg = (glyphsData, options) => {
  let result = "";

  return new Promise((resolve, reject) => {
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
      glyphStream.metadata = glyphData.metadata;

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
};

const toTtf = (buffer, options) => Buffer.from(svg2ttf(buffer, options).buffer);

const toEot = (buffer) => convertTtfToEot(buffer);

const toWoff = (buffer, options) => Buffer.from(ttf2woff(buffer, options).buffer);

const toWoff2 = (buffer) => wawoff2.compress(buffer);

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

  const foundFiles = await globby([].concat(options.files));
  const filteredFiles = foundFiles.filter((foundFile) => path.extname(foundFile) === ".svg");

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  let glyphsData = (await getGlyphsData(filteredFiles, options)) as GlyphData[];

  if (options.glyphTransformFn && typeof options.glyphTransformFn === "function") {
    const transformedGlyphs = glyphsData.map(async (glyphData: GlyphData) => {
      const metadata = await options.glyphTransformFn(glyphData.metadata);

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

  const svg = (await toSvg(glyphsData, options)) as Result["svg"];
  const ttf = toTtf(svg, ttfOptions);

  const result: Result = {
    glyphsData,
    hash: crypto.createHash("md5").update(svg).digest("hex"),
    svg,
    ttf,
  };

  if (options.formats.includes("eot")) {
    result.eot = toEot(ttf);
  }

  if (options.formats.includes("woff")) {
    result.woff = toWoff(ttf, { metadata: options.metadata });
  }

  if (options.formats.includes("woff2")) {
    result.woff2 = await toWoff2(ttf);
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
        glyphs: result.glyphsData.map((glyph: GlyphData) => glyph.metadata),
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
          new Map(
            options.formats.map((format: Format) => [
              format,
              () => {
                if (format === "woff2") {
                  return Buffer.from(result.woff2).toString("base64");
                }
                return result[format].toString("base64");
              },
            ]),
          ),
        ),
      },
    ]);

    result.template = nunjucks.render(templateFilePath, nunjucksOptions);
  }

  if (!options.formats.includes("svg")) {
    delete result.svg;
  }

  if (!options.formats.includes("ttf")) {
    delete result.ttf;
  }

  if (discoveredConfigPath) {
    result.config = { ...options, filePath: discoveredConfigPath };
  } else {
    result.config = options;
  }

  return result;
};

export default webfont;
