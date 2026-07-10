import { webfont } from "./standalone";

export { diagnoseGlyphsData, diagnoseSvgContents } from "./lib/svgDiagnostics/diagnoseSvgContents";
export { mergeCliDestIntoConfig, writeResultFiles } from "./node/writeResultFiles";
export {
  buildCliFlagReferences,
  buildWebfontOptionsReference,
  type WebfontApiOnlyOptionReference,
  type WebfontCliFlagReference,
  type WebfontOptionsReference,
} from "./optionsReference/buildWebfontOptionsReference";
export {
  CLI_FLAG_SECTIONS,
  CLI_INPUT_SECTION,
  CLI_USAGE_LINE,
  type CliFlagCatalogEntry,
  type CliFlagSection,
  type CliFlagType,
} from "./optionsReference/cliFlagCatalog";
export { webfont } from "./standalone";
export { defaultWebfontOptions } from "./standalone/defaultOptions";
export type { Result } from "./types/Result";
export type { ResultConfig } from "./types/ResultConfig";
export type { SvgDiagnosticCode, SvgGlyphDiagnostic, SvgToolsOptions } from "./types/SvgToolsOptions";
export type { WebfontOptions } from "./types/WebfontOptions";
export {
  type AssistantWizardCompletion,
  buildWasConfigFromWizard,
} from "./was/buildWasConfig";
export { cleanOptionalWasBasename, cleanWasConfigBasename } from "./was/cleanWasConfigBasename";
export { guardLoadedWasConfigs, parseWasConfigJson } from "./was/guardWasConfigLoad";
export { loadWasConfigs } from "./was/loadWasConfigs";
export { mapWasConfigToWebfontOptions } from "./was/mapWasConfigToWebfontOptions";
export type { AssistantWizardAnswers, WebfontAssistantWasConfig } from "./was/types";
export default webfont;
