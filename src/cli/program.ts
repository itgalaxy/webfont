import * as fs from "fs";
import * as path from "path";
import resolveFrom from "resolve-from";
import { resolveDecompressedFontBasenames } from "../lib/inputSource";
import { webfont } from "../standalone";
import type { DecompressedFont } from "../types/DecompressedFont";
import type { InitialOptions } from "../types/InitialOptions";
import type { OptionsBase } from "../types/OptionsBase";
import type { RenderedTemplate } from "../types/RenderedTemplate";
import type { Result } from "../types/Result";
import type { TranscodedFont } from "../types/TranscodedFont";
import { buildSvgToolsFromCliFlags } from "./buildSvgToolsFromCliFlags";
import { parseFormatsFlag } from "./parseFormatsFlag";
import { parseTemplateFlag } from "./parseTemplateFlag";
import { resolveCliFiles } from "./resolveCliFiles";

export type CliLike = {
  flags: {
    addHashInFontUrl?: boolean;
    ascent?: string;
    centerHorizontally?: boolean;
    config?: string;
    descent?: string;
    dest?: string;
    destCreate?: boolean;
    destTemplate?: string;
    fixedWidth?: boolean;
    fontHeight?: string;
    fontId?: string;
    fontName?: string;
    fontStyle?: string;
    fontWeight?: string;
    formats?: string;
    help?: boolean;
    ligatures?: boolean;
    metadata?: string;
    normalize?: boolean;
    prependUnicode?: boolean;
    round?: string;
    sort?: boolean;
    startUnicode?: string;
    unicodeRange?: boolean;
    template?: string;
    templateCacheString?: string;
    templateClassName?: string;
    templateFontName?: string;
    templateFontPath?: string;
    verbose?: boolean;
    svgDiagnose?: boolean;
    version?: boolean;
  };
  input: string[];
  showHelp: () => void;
  showVersion: () => void;
};

export type ResultFileKey = "eot" | "hash" | "otf" | "svg" | "template" | "ttf" | "woff" | "woff2";

export const resultFileKeys: ResultFileKey[] = ["svg", "ttf", "otf", "eot", "woff", "woff2", "hash", "template"];

export const buildOptionsBase = (cli: CliLike): OptionsBase => {
  const optionsBase: OptionsBase = {};

  if (typeof cli.flags.config === "string") {
    optionsBase.configFile =
      resolveFrom.silent(process.cwd(), cli.flags.config) || path.join(process.cwd(), cli.flags.config);
  }

  if (cli.flags.fontName) {
    optionsBase.fontName = cli.flags.fontName;
  }

  if (cli.flags.formats) {
    optionsBase.formats = parseFormatsFlag(cli.flags.formats);
  }

  if (cli.flags.dest) {
    optionsBase.dest = cli.flags.dest;
  }

  if (cli.flags.destCreate) {
    optionsBase.destCreate = cli.flags.destCreate;
  }

  if (cli.flags.template) {
    optionsBase.template = parseTemplateFlag(cli.flags.template);
  }

  if (cli.flags.templateClassName) {
    optionsBase.templateClassName = cli.flags.templateClassName;
  }

  if (cli.flags.templateFontPath) {
    optionsBase.templateFontPath = cli.flags.templateFontPath;
  }

  if (cli.flags.templateFontName) {
    optionsBase.templateFontName = cli.flags.templateFontName;
  }

  if (cli.flags.templateCacheString) {
    optionsBase.templateCacheString = cli.flags.templateCacheString;
  }

  if (cli.flags.destTemplate) {
    optionsBase.destTemplate = cli.flags.destTemplate;
  }

  if (cli.flags.verbose) {
    optionsBase.verbose = cli.flags.verbose;
  }

  if (cli.flags.fontId) {
    optionsBase.fontId = cli.flags.fontId;
  }

  if (cli.flags.fontStyle) {
    optionsBase.fontStyle = cli.flags.fontStyle;
  }

  if (cli.flags.fontWeight) {
    optionsBase.fontWeight = cli.flags.fontWeight;
  }

  if (cli.flags.fixedWidth) {
    optionsBase.fixedWidth = cli.flags.fixedWidth;
  }

  if (cli.flags.centerHorizontally) {
    optionsBase.centerHorizontally = cli.flags.centerHorizontally;
  }

  if (cli.flags.normalize) {
    optionsBase.normalize = cli.flags.normalize;
  }

  if (cli.flags.fontHeight) {
    optionsBase.fontHeight = cli.flags.fontHeight;
  }

  if (cli.flags.round) {
    optionsBase.round = cli.flags.round;
  }

  if (cli.flags.descent) {
    optionsBase.descent = cli.flags.descent;
  }

  if (cli.flags.ascent) {
    optionsBase.ascent = cli.flags.ascent;
  }

  if (cli.flags.startUnicode) {
    optionsBase.startUnicode = cli.flags.startUnicode;
  }

  if (cli.flags.prependUnicode) {
    optionsBase.prependUnicode = cli.flags.prependUnicode;
  }

  if (cli.flags.metadata) {
    optionsBase.metadata = cli.flags.metadata;
  }

  if (cli.flags.sort === false) {
    optionsBase.sort = cli.flags.sort;
  }

  if (cli.flags.ligatures === false) {
    optionsBase.ligatures = cli.flags.ligatures;
  }

  if (cli.flags.unicodeRange === false) {
    optionsBase.unicodeRange = cli.flags.unicodeRange;
  }

  if (cli.flags.addHashInFontUrl) {
    optionsBase.addHashInFontUrl = cli.flags.addHashInFontUrl;
  }

  const svgTools = buildSvgToolsFromCliFlags(cli.flags);

  if (svgTools) {
    optionsBase.svgTools = svgTools;
  }

  return optionsBase;
};

export const ensureResultConfig = (result: Result): ResultConfig => {
  if (!result.config) {
    throw new Error("Missing config in webfont result");
  }

  return result.config;
};

export const mergeCliDestIntoConfig = (
  result: Result,
  options: Pick<InitialOptions, "dest" | "destTemplate">,
): Result => {
  const config = ensureResultConfig(result);

  result.config = {
    ...config,
    dest: options.dest,
    destTemplate: options.destTemplate,
  };

  return result;
};

export const resolveTemplateOutputPath = (
  template: string,
  config: ResultConfig,
  usedBuiltIn: boolean,
): string => {
  const dest = config.dest ?? process.cwd();
  let destTemplate = dest;

  if (typeof config.destTemplate === "string") {
    destTemplate = config.destTemplate;
  }

  if (usedBuiltIn) {
    return path.join(destTemplate, `${config.fontName}.${template}`);
  }

  return path.join(destTemplate, path.basename(template).replace(".njk", ""));
};

const getPrimaryTemplateOption = (template: ResultConfig["template"]): string | undefined => {
  if (Array.isArray(template)) {
    return template[0];
  }

  return template;
};

export const resolveDestTemplate = (result: Result, config: ResultConfig): string | undefined => {
  if (!result.template) {
    return undefined;
  }

  const primaryTemplate = getPrimaryTemplateOption(config.template);

  if (result.usedBuildInTemplate && primaryTemplate) {
    return resolveTemplateOutputPath(primaryTemplate, config, true);
  }

  if (primaryTemplate) {
    return resolveTemplateOutputPath(primaryTemplate, config, false);
  }

  const dest = config.dest ?? process.cwd();

  if (typeof config.destTemplate === "string") {
    return config.destTemplate;
  }

  return dest;
};

export const writeRenderedTemplates = async (
  templates: readonly RenderedTemplate[],
  config: ResultConfig,
): Promise<void> => {
  await Promise.all(
    templates.map(async (entry) => {
      const file = path.resolve(resolveTemplateOutputPath(entry.template, config, Boolean(entry.builtIn)));

      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, entry.content);
    }),
  );
};

export const getResultOutputPath = (
  type: ResultFileKey,
  _result: Result,
  config: ResultConfig,
  destTemplate?: string,
): string => {
  const fontName = config.fontName;
  const dest = config.dest ?? process.cwd();

  if (type === "template") {
    return path.resolve(destTemplate ?? dest);
  }

  if (type === "hash") {
    return path.resolve(path.join(dest, `${fontName}.hash`));
  }

  return path.resolve(path.join(dest, `${fontName}.${type}`));
};

export const createMissingDestError = (dest: string): Error =>
  new Error(`Destination directory "${dest}" does not exist. Use --dest-create (-m) to create it.`);

export const ensureDestExists = async (dest: string, destCreate?: boolean): Promise<void> => {
  try {
    await fs.promises.access(dest, fs.constants.F_OK);
  } catch {
    if (destCreate) {
      await fs.promises.mkdir(dest, { recursive: true });
      return;
    }

    throw createMissingDestError(dest);
  }
};

export const getDecompressedFontOutputBasename = (
  fonts: readonly { source: string }[],
  font: { source: string },
  config: ResultConfig,
): string => {
  if (fonts.length === 1 && config.fontName) {
    return config.fontName;
  }

  const basenames = resolveDecompressedFontBasenames(fonts.map((entry) => entry.source));
  const index = fonts.indexOf(font);

  return basenames[index] ?? config.fontName;
};

export const writeDecompressedFontFiles = async (
  fonts: readonly DecompressedFont[],
  config: ResultConfig,
  dest: string,
): Promise<void> => {
  await Promise.all(
    fonts.flatMap((font) => {
      const basename = getDecompressedFontOutputBasename(fonts, font, config);
      const writes: Promise<void>[] = [];

      if (font.ttf) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.ttf`)), font.ttf));
      }

      if (font.otf) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.otf`)), font.otf));
      }

      return writes;
    }),
  );
};

export const getTranscodedFontOutputBasename = (
  fonts: readonly TranscodedFont[],
  font: TranscodedFont,
  config: ResultConfig,
): string => getDecompressedFontOutputBasename(fonts, font, config);

export const writeTranscodedFontFiles = async (
  fonts: readonly TranscodedFont[],
  config: ResultConfig,
  dest: string,
): Promise<void> => {
  await Promise.all(
    fonts.flatMap((font) => {
      const basename = getTranscodedFontOutputBasename(fonts, font, config);
      const writes: Promise<void>[] = [];

      if (font.ttf) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.ttf`)), font.ttf));
      }

      if (font.eot) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.eot`)), font.eot));
      }

      if (font.woff) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.woff`)), font.woff));
      }

      if (font.woff2) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.woff2`)), font.woff2));
      }

      return writes;
    }),
  );
};

export const writeResultFiles = async (result: Result): Promise<Result> => {
  const config = ensureResultConfig(result);
  const dest = config.dest ?? process.cwd();
  const destTemplate = resolveDestTemplate(result, config);

  if (result.template) {
    delete result.hash;
  }

  await ensureDestExists(dest, config.destCreate);

  if (result.templates && result.templates.length > 0) {
    await writeRenderedTemplates(result.templates, config);
  }

  if (result.transcodedFonts && result.transcodedFonts.length > 1) {
    await writeTranscodedFontFiles(result.transcodedFonts, config, dest);
    return result;
  }

  if (result.decompressedFonts && result.decompressedFonts.length > 1) {
    await writeDecompressedFontFiles(result.decompressedFonts, config, dest);
    return result;
  }

  await Promise.all(
    resultFileKeys
      .filter((type) => {
        if (type === "template" && result.templates && result.templates.length > 0) {
          return false;
        }

        return result[type] !== undefined;
      })
      .map(async (type) => {
        const content = result[type];

        if (content === undefined) {
          return;
        }

        const file = getResultOutputPath(type, result, config, destTemplate);

        await fs.promises.writeFile(file, content);
      }),
  );

  return result;
};

export const getExitCode = (error: unknown): number => {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "number") {
    return error.code;
  }

  return 1;
};

export const startCli = (cli: CliLike): void => {
  runCli(cli).catch((error) => {
    // CLI surfaces stack traces before exiting with a non-zero code.
    // biome-ignore lint/suspicious/noConsole: intentional CLI error output
    console.log(error.stack);

    process.exit(getExitCode(error));
  });
};

export const runCli = async (cli: CliLike): Promise<Result> => {
  if (cli.flags.help) {
    cli.showHelp();
  }

  if (cli.flags.version) {
    cli.showVersion();
  }

  const optionsBase = buildOptionsBase(cli);
  const files = await resolveCliFiles(cli, optionsBase);

  if (files.length === 0) {
    cli.showHelp();
  }

  const options = { ...optionsBase, files };

  const result = await webfont(options);
  mergeCliDestIntoConfig(result, options);

  return writeResultFiles(result);
};
