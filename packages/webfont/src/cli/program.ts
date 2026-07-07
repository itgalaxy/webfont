import * as path from "path";
import resolveFrom from "resolve-from";
import { mergeCliDestIntoConfig, writeResultFiles } from "../node/writeResultFiles";
import { webfont } from "../standalone";
import type { OptionsBase } from "../types/OptionsBase";
import type { Result } from "../types/Result";
import { buildSvgToolsFromCliFlags } from "./buildSvgToolsFromCliFlags";
import { parseFormatsFlag } from "./parseFormatsFlag";
import { parseTemplateFlag } from "./parseTemplateFlag";
import { resolveCliFiles } from "./resolveCliFiles";

export type { ResultFileKey } from "../node/writeResultFiles";
export { mergeCliDestIntoConfig, writeResultFiles } from "../node/writeResultFiles";

export type CliLike = {
  flags: {
    addHashInFontUrl?: boolean;
    ascent?: string;
    centerHorizontally?: boolean;
    centerVertically?: boolean;
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
    optimizeSvg?: boolean;
    prependUnicode?: boolean;
    round?: string;
    sort?: boolean;
    startUnicode?: string;
    templateFontLigatures?: boolean;
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

  if (cli.flags.centerVertically) {
    optionsBase.centerVertically = cli.flags.centerVertically;
  }

  if (cli.flags.normalize) {
    optionsBase.normalize = cli.flags.normalize;
  }

  if (cli.flags.optimizeSvg) {
    optionsBase.optimizeSvg = cli.flags.optimizeSvg;
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

  if (cli.flags.ligatures) {
    optionsBase.ligatures = cli.flags.ligatures;
  }

  if (cli.flags.unicodeRange) {
    optionsBase.unicodeRange = cli.flags.unicodeRange;
  }

  if (cli.flags.templateFontLigatures === false) {
    optionsBase.templateFontLigatures = cli.flags.templateFontLigatures;
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
