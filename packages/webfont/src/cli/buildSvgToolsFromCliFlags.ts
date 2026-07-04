import type { SvgToolsOptions } from "../types/SvgToolsOptions";

export const buildSvgToolsFromCliFlags = (flags: { svgDiagnose?: boolean }): SvgToolsOptions | undefined => {
  if (!flags.svgDiagnose) {
    return undefined;
  }

  return { diagnose: true };
};
