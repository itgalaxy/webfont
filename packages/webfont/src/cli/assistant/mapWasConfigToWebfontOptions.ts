import type { InitialOptions } from "../../types/InitialOptions";
import type { WebfontAssistantWasConfig } from "./types";

export const mapWasConfigToWebfontOptions = (was: WebfontAssistantWasConfig): InitialOptions => {
  const displayName = was.name;
  const classPrefix = was.prefix ?? was.fontName ?? displayName;
  let formats = was.formats;
  if (formats.length === 0) {
    formats = ["ttf"];
  }

  return {
    dest: was.dest,
    destCreate: true,
    files: was.files,
    fixedWidth: was.fixedWidth ?? true,
    fontHeight: was.fontHeight ?? 1000,
    fontId: was.fontId ?? classPrefix,
    fontName: displayName,
    formats,
    template: was.template,
    templateClassName: classPrefix,
    templateFontName: was.templateFontName ?? displayName,
  };
};
