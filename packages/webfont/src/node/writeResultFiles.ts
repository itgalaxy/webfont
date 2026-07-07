import * as fs from "fs";
import * as path from "path";
import { resolveDecompressedFontBasenames } from "../lib/inputSource";
import type { DecompressedFont } from "../types/DecompressedFont";
import type { InitialOptions } from "../types/InitialOptions";
import type { RenderedTemplate } from "../types/RenderedTemplate";
import type { Result } from "../types/Result";
import type { ResultConfig } from "../types/ResultConfig";
import type { TranscodedFont } from "../types/TranscodedFont";

export type ResultFileKey = "eot" | "hash" | "otf" | "svg" | "template" | "ttf" | "woff" | "woff2";

export const resultFileKeys: ResultFileKey[] = ["svg", "ttf", "otf", "eot", "woff", "woff2", "hash", "template"];

export const ensureResultConfig = (result: Result): ResultConfig => {
  if (!result.config) {
    throw new Error("Missing config in webfont result");
  }

  return result.config;
};

/** Copy `dest` / `destTemplate` from run options onto `result.config` before `writeResultFiles`. */
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

      if (font.svg) {
        writes.push(fs.promises.writeFile(path.resolve(path.join(dest, `${basename}.svg`)), font.svg));
      }

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

/** Write font buffers and templates from a `webfont()` result to disk (same rules as the CLI). */
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
