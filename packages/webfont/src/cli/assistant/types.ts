import type { Format } from "../../types/Format";

/** Saved `.was` format (compatible with webfont-assistant). */
export type WebfontAssistantWasConfig = {
  dest: string;
  files: string;
  fixedWidth?: boolean;
  fontHeight?: number;
  fontId?: string;
  /**
   * @deprecated Icon class prefix stored under the wrong key in legacy `.was` files.
   * Use `prefix`. Still read for backward compatibility; built-in `--assistant` writes
   * `prefix` only. Will be removed in the next breaking `.was` format change.
   */
  fontName?: string;
  formats: Format[];
  isCustomTemplate?: boolean;
  name: string;
  prefix?: string;
  styleType?: string;
  template: string;
  templateFontName?: string;
};

export type AssistantWizardAnswers = {
  glyphs: string;
  name: string;
  output: string;
  prefix: string;
};
