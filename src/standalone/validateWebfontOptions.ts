import { assertFormatsOption } from "../lib/parseFormats";
import { normalizeTemplateOption } from "../lib/parseTemplateOption";
import type { WebfontOptions } from "../types/WebfontOptions";

const assertStringOption = (name: string, value: unknown): void => {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
};

const assertBooleanOrStringOption = (name: string, value: unknown): void => {
  if (value !== undefined && typeof value !== "boolean" && typeof value !== "string") {
    throw new Error(`${name} must be a boolean or string`);
  }
};

const assertFilesOption = (files: unknown): void => {
  if (typeof files === "string") {
    if (files.length === 0) {
      throw new Error("files must not be empty");
    }

    return;
  }

  if (Array.isArray(files)) {
    if (files.length === 0) {
      throw new Error("files must not be empty");
    }

    if (!files.every((entry) => typeof entry === "string")) {
      throw new Error("files must be a string or an array of strings");
    }

    return;
  }

  throw new Error("files must be a string or an array of strings");
};

/**
 * Runtime validation for merged webfont options (API, cosmiconfig, CLI).
 * Rejects mis-typed or unknown format names before running a pipeline (#133).
 */
export const validateWebfontOptions = (options: WebfontOptions): WebfontOptions => {
  assertFilesOption(options.files);
  options.formats = assertFormatsOption(options.formats);
  assertStringOption("fontName", options.fontName);
  assertBooleanOrStringOption("unicodeRange", options.unicodeRange);
  if (options.template !== undefined) {
    normalizeTemplateOption(options.template);
  }
  assertStringOption("templateFontPath", options.templateFontPath);

  return options;
};
