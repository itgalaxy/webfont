import type { Format } from "../../types/Format";
import type { AssistantWizardAnswers, WebfontAssistantWasConfig } from "./types";

export type AssistantWizardCompletion = {
  formats: Format[];
  isCustomTemplate: boolean;
  styleType: string;
  template: string;
};

export const buildWasConfigFromWizard = (
  answers: AssistantWizardAnswers,
  completion: AssistantWizardCompletion,
): WebfontAssistantWasConfig => ({
  dest: answers.output,
  files: `${answers.glyphs}/*.svg`,
  fixedWidth: true,
  fontHeight: 1000,
  fontId: answers.prefix,
  formats: completion.formats,
  isCustomTemplate: completion.isCustomTemplate,
  name: answers.name,
  prefix: answers.prefix,
  styleType: completion.styleType,
  template: completion.template,
  templateFontName: answers.name,
});
