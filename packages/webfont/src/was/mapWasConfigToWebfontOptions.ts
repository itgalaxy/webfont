import type { Format } from "../types/Format";
import type { InitialOptions } from "../types/InitialOptions";
import { cleanOptionalWasBasename, cleanWasConfigBasename } from "./cleanWasConfigBasename";
import type { WebfontAssistantWasConfig } from "./types";

const DEFAULT_WAS_FORMATS: Format[] = ["ttf"];

const normalizeWasFormats = (formats: WebfontAssistantWasConfig["formats"] | unknown): Format[] => {
  if (!Array.isArray(formats) || formats.length === 0) {
    return DEFAULT_WAS_FORMATS;
  }

  return formats as Format[];
};

export const mapWasConfigToWebfontOptions = (was: WebfontAssistantWasConfig): InitialOptions => {
  const displayName = cleanWasConfigBasename(was.name, "name");
  const classPrefix =
    cleanOptionalWasBasename(was.prefix, "prefix") ??
    cleanOptionalWasBasename(was.fontName, "fontName") ??
    displayName;
  const formats = normalizeWasFormats(was.formats);

  let fontId = classPrefix;
  const cleanedFontId = cleanOptionalWasBasename(was.fontId, "fontId");
  if (cleanedFontId !== undefined) {
    fontId = cleanedFontId;
  }

  let templateFontName = displayName;
  const cleanedTemplateFontName = cleanOptionalWasBasename(was.templateFontName, "templateFontName");
  if (cleanedTemplateFontName !== undefined) {
    templateFontName = cleanedTemplateFontName;
  }

  const options: InitialOptions = {
    dest: was.dest,
    destCreate: true,
    files: was.files,
    fontId,
    fontName: displayName,
    formats,
    template: was.template,
    templateClassName: classPrefix,
    templateFontName,
  };

  if (was.fixedWidth !== undefined) {
    options.fixedWidth = was.fixedWidth;
  }

  if (was.fontHeight !== undefined) {
    options.fontHeight = was.fontHeight;
  }

  return options;
};
