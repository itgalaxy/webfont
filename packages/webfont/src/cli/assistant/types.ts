import type { Format } from "../../types/Format";

/** Saved `.was` format (compatible with webfont-assistant). */
export type WebfontAssistantWasConfig = {
  dest: string;
  files: string;
  fixedWidth?: boolean;
  fontHeight?: number;
  fontId?: string;
  /** Legacy: icon class prefix in older `.was` files. */
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
