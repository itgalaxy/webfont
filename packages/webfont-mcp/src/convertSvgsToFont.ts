import { mkdir, rm } from "node:fs/promises";
import { defaultWebfontOptions, mergeCliDestIntoConfig, webfont, writeResultFiles } from "webfont";
import { getWorkspaceRoot, resolvePathWithinRoot } from "./pathSandbox.js";
import { resolveSvgInputPaths } from "./resolveSvgInputs.js";
import { serializeConversionResult } from "./serializeResult.js";

/** SVG→font formats only — OTF is for WOFF/WOFF2 decompression, not convert_svgs_to_font. */
export type WebfontFormat = "eot" | "woff" | "woff2" | "svg" | "ttf";

export type ConvertSvgsToFontInput = {
  centerHorizontally?: boolean;
  centerVertically?: boolean;
  dest: string;
  destCreate?: boolean;
  files: string[];
  fontName?: string;
  formats?: WebfontFormat[];
  normalize?: boolean;
  svgToolsDiagnose?: boolean;
  template?: string;
  workspaceRoot?: string;
};

export const convertSvgsToFont = async (input: ConvertSvgsToFontInput) => {
  const defaults = defaultWebfontOptions();
  const workspaceRoot = getWorkspaceRoot(input.workspaceRoot);
  const files = await resolveSvgInputPaths(input.files, workspaceRoot);
  const dest = resolvePathWithinRoot(input.dest, workspaceRoot);

  if (input.destCreate) {
    await mkdir(dest, { recursive: true });
  }

  let svgTools: { diagnose: true } | undefined;
  if (input.svgToolsDiagnose) {
    svgTools = { diagnose: true };
  }

  const result = await webfont({
    centerHorizontally: input.centerHorizontally ?? defaults.centerHorizontally,
    centerVertically: input.centerVertically ?? defaults.centerVertically,
    dest,
    destCreate: input.destCreate,
    files,
    fontName: input.fontName ?? defaults.fontName,
    formats: input.formats ?? ["woff2"],
    normalize: input.normalize ?? defaults.normalize,
    svgTools,
    template: input.template,
  });

  mergeCliDestIntoConfig(result, { dest });
  await writeResultFiles(result);

  return serializeConversionResult(result, dest);
};

export const resetConversionDest = async (dest: string): Promise<void> => {
  await rm(dest, { force: true, recursive: true });
};
