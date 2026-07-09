import type { Format } from "../../types/Format";
import type { InitialOptions } from "../../types/InitialOptions";
import { cleanWasConfigBasename } from "./cleanWasConfigBasename";
import type { WebfontAssistantWasConfig } from "./types";

const DEFAULT_WAS_FORMATS: Format[] = ["ttf"];

const normalizeWasFormats = (formats: WebfontAssistantWasConfig["formats"] | unknown): Format[] => {
  if (!Array.isArray(formats) || formats.length === 0) {
    return DEFAULT_WAS_FORMATS;
  }

  return formats as Format[];
};

export const mapWasConfigToWebfontOptions = (was: WebfontAssistantWasConfig): InitialOptions => {
  const displayName = cleanWasConfigBasename(was.name);
  const classPrefix = cleanWasConfigBasename(was.prefix ?? was.fontName ?? displayName);
  const formats = normalizeWasFormats(was.formats);

  let fontId = classPrefix;
  if (was.fontId) {
    fontId = cleanWasConfigBasename(was.fontId);
  }

  let templateFontName = displayName;
  if (was.templateFontName) {
    templateFontName = cleanWasConfigBasename(was.templateFontName);
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
