import { applySvgDiagnosticsToGlyphs } from "@webfont/lib/svgTools/applySvgDiagnostics";
import { encodeTtfToEot, encodeTtfToWoff, encodeTtfToWoff2 } from "@webfont/lib/ttfEncode";
import { generateSvgFont } from "@webfont/standalone/generateSvgFont";
import toTtf from "@webfont/standalone/toTtf";
import type { GlyphData } from "@webfont/types/GlyphData";
import type { Result } from "@webfont/types/Result";
import type { WebfontOptions } from "@webfont/types/WebfontOptions";
import crypto from "crypto";
import { applySvgFixesInBrowserWorker } from "./applySvgFixesInBrowserWorker";
import type { StudioSvgToolsOptions } from "./studioSvgTools";
import { normalizeStudioSvgFixOption } from "./studioSvgTools";

/** Browser-worker SVG pipeline: diagnostics + WASM outline-stroke fix (alpha). */
export const runSvgPipelineInBrowserWorker = async (
  glyphsData: GlyphData[],
  options: WebfontOptions,
): Promise<Result> => {
  const studioSvgTools = options.svgTools as StudioSvgToolsOptions | undefined;
  const hasFix = Boolean(normalizeStudioSvgFixOption(studioSvgTools?.fix));
  const hasDiagnose = Boolean(studioSvgTools?.diagnose);
  const shouldReport = Boolean(studioSvgTools?.onMessage || hasDiagnose || options.verbose || hasFix);

  const reporter = (message: string): void => {
    studioSvgTools?.onMessage?.(message);
  };

  const { diagnostics, glyphs: diagnosedGlyphs } = applySvgDiagnosticsToGlyphs(glyphsData, studioSvgTools, {
    reporter: shouldReport ? reporter : undefined,
    verbose: options.verbose,
  });

  const pipelineGlyphs = await applySvgFixesInBrowserWorker(
    diagnosedGlyphs,
    studioSvgTools,
    shouldReport ? reporter : undefined,
  );

  let ttfOptions = {};

  if (options.formatsOptions?.ttf) {
    ttfOptions = options.formatsOptions.ttf;
  }

  const svg = await generateSvgFont(pipelineGlyphs, options);
  const ttf = toTtf(svg, ttfOptions);

  const result: Result = {
    config: options,
    glyphsData: pipelineGlyphs,
    hash: crypto.createHash("md5").update(svg).digest("hex"),
    svg,
    ttf,
  };

  if (diagnostics.length > 0) {
    result.svgDiagnostics = diagnostics;
  }

  const { formats } = options;

  if (formats.includes("eot")) {
    result.eot = encodeTtfToEot(ttf);
  }

  if (formats.includes("woff")) {
    let metadata: string | undefined;

    if (typeof options.metadata === "string") {
      metadata = options.metadata;
    }

    result.woff = encodeTtfToWoff(ttf, { metadata });
  }

  if (formats.includes("woff2")) {
    result.woff2 = Buffer.from(await encodeTtfToWoff2(ttf));
  }

  if (!formats.includes("svg")) {
    delete result.svg;
  }

  if (!formats.includes("ttf")) {
    delete result.ttf;
  }

  return result;
};
