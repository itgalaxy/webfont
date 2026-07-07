import { webfont } from "./standalone";

export { diagnoseGlyphsData, diagnoseSvgContents } from "./lib/svgDiagnostics/diagnoseSvgContents";
export { mergeCliDestIntoConfig, writeResultFiles } from "./node/writeResultFiles";
export { webfont } from "./standalone";
export type { Result } from "./types/Result";
export type { ResultConfig } from "./types/ResultConfig";
export type { SvgDiagnosticCode, SvgGlyphDiagnostic, SvgToolsOptions } from "./types/SvgToolsOptions";
export default webfont;
