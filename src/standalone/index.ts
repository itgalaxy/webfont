import { cosmiconfig } from "cosmiconfig";
import deepmerge from "deepmerge";
import path from "path";
import { resolveInputSources } from "../lib/inputSource";
import type { InitialOptions } from "../types";
import type { Result } from "../types/Result";
import type { ResultConfig } from "../types/ResultConfig";
import { convertTtfInput } from "./convertTtfInput";
import { convertWebfontInput } from "./convertWebfontInput";
import { getGlyphsData } from "./glyphsData";
import { assertSvgPipelineFormats, classifyInputFiles, filterInputFilesByMode } from "./inputMode";
import { getOptions } from "./options";
import { runSvgPipeline } from "./runSvgPipeline";
import { validateWebfontOptions } from "./validateWebfontOptions";

type CosmiconfigLoaded = NonNullable<Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>>>;

const isCosmiconfigLoaded = (value: CosmiconfigLoaded | Record<string, never>): value is CosmiconfigLoaded =>
  "filepath" in value;

const buildConfig = async (options: {
  configFile?: string;
}): Promise<CosmiconfigLoaded | Record<string, never>> => {
  const configExplorer = cosmiconfig("webfont", {
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

  const glyphsData = await getGlyphsData(filteredFiles, options);

  const result = await runSvgPipeline(glyphsData, options);

  if (discoveredConfigPath) {
    result.config = { ...options, filePath: discoveredConfigPath };
  } else {
    result.config = options;
  }

  return result;
};

export default webfont;
