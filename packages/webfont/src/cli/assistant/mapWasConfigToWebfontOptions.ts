import type { InitialOptions } from "../../types/InitialOptions";
import type { WebfontAssistantWasConfig } from "./types";

export const mapWasConfigToWebfontOptions = (was: WebfontAssistantWasConfig): InitialOptions => {
  const displayName = was.name;
  const classPrefix = was.prefix ?? was.fontName ?? displayName;
  let formats = was.formats;
  if (formats.length === 0) {
    formats = ["ttf"];
  }

  const options: InitialOptions = {
    dest: was.dest,
    destCreate: true,
    files: was.files,
    fontId: was.fontId ?? classPrefix,
    fontName: displayName,
    formats,
    template: was.template,
    templateClassName: classPrefix,
    templateFontName: was.templateFontName ?? displayName,
  };

  if (was.fixedWidth !== undefined) {
    options.fixedWidth = was.fixedWidth;
  }

  if (was.fontHeight !== undefined) {
    options.fontHeight = was.fontHeight;
  }

  return options;
};
