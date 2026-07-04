import type { SvgToolsOptions } from "../../types/SvgToolsOptions";

export const normalizeSvgToolsOptions = (svgTools?: SvgToolsOptions): SvgToolsOptions | undefined => {
  if (!svgTools) {
    return undefined;
  }

  if (!svgTools.diagnose) {
    return undefined;
  }

  const normalized: SvgToolsOptions = { diagnose: true };

  if (svgTools.onMessage) {
    normalized.onMessage = svgTools.onMessage;
  }

  return normalized;
};
