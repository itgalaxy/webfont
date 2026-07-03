import crypto from "crypto";
import { applyOptimizeSvgToGlyphs } from "../lib/applyOptimizeSvgToGlyphs";
import { formatLargeFontLigatureWarning, shouldWarnLargeFontLigatures } from "../lib/largeFontLigatures";
import { assertNonEmptySvgFontGlyphs } from "../lib/svgFontOutput/emptyGlyphPaths";
import { applySvgToolsToGlyphs } from "../lib/svgTools/applySvgTools";
import { encodeTtfToEot, encodeTtfToWoff, encodeTtfToWoff2 } from "../lib/ttfEncode";
import type { GlyphData, WebfontOptions } from "../types";
import type { Result } from "../types/Result";
import { generateSvgFont } from "./generateSvgFont";
import toTtf from "./toTtf";

const toEot = (buffer: Buffer) => encodeTtfToEot(buffer);

const toWoff = (buffer: Buffer, options: { metadata?: string }) => encodeTtfToWoff(buffer, options);

const toWoff2 = (buffer: Buffer) => encodeTtfToWoff2(buffer);

export const runSvgPipeline = async (glyphsData: GlyphData[], options: WebfontOptions): Promise<Result> => {
  const reporter = (message: string): void => {
    if (options.svgTools?.onMessage) {
      options.svgTools.onMessage(message);
      return;
    }

    if (options.svgTools?.diagnose || options.verbose) {
      // biome-ignore lint/suspicious/noConsole: svgTools / verbose diagnostics
      console.log(message);
    }
  };

  const shouldReport = Boolean(options.svgTools?.onMessage || options.svgTools?.diagnose || options.verbose);
  let pipelineReporter: typeof reporter | undefined;

  if (shouldReport) {
    pipelineReporter = reporter;
  }

  const { diagnostics, glyphs: diagnosedGlyphs } = applySvgToolsToGlyphs(glyphsData, options.svgTools, {
    reporter: pipelineReporter,
    verbose: options.verbose,
  });

  let pipelineGlyphs = diagnosedGlyphs;

  if (options.optimizeSvg) {
    pipelineGlyphs = applyOptimizeSvgToGlyphs(pipelineGlyphs, options.svgoConfig);
  }

  if (options.glyphContentTransformFn) {
    const glyphContentTransformFn = options.glyphContentTransformFn;
    pipelineGlyphs = await Promise.all(
      pipelineGlyphs.map(async (glyphData) => {
        const contents = await glyphContentTransformFn(glyphData);

        return {
          ...glyphData,
          contents,
        };
      }),
    );
  }

  if (options.glyphTransformFn) {
    const glyphTransformFn = options.glyphTransformFn;
    pipelineGlyphs = await Promise.all(
      pipelineGlyphs.map(async (glyphData) => {
        const metadata = await glyphTransformFn(glyphData.metadata ?? { name: "", unicode: [] });

        return {
          ...glyphData,
          metadata,
        };
      }),
    );
  }

  if (shouldWarnLargeFontLigatures(pipelineGlyphs.length, options.ligatures)) {
    // biome-ignore lint/suspicious/noConsole: user-facing performance warning (#558)
    console.log(formatLargeFontLigatureWarning(pipelineGlyphs.length));
  }

  let ttfOptions = {};

  if (options.formatsOptions?.ttf) {
    ttfOptions = options.formatsOptions.ttf;
  }

  const svg = await generateSvgFont(pipelineGlyphs, options);
  assertNonEmptySvgFontGlyphs(svg, pipelineGlyphs);
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
    result.eot = toEot(ttf);
  }

  if (formats.includes("woff")) {
    let metadata: string | undefined;

    if (typeof options.metadata === "string") {
      metadata = options.metadata;
    }

    result.woff = toWoff(ttf, { metadata });
  }

  if (formats.includes("woff2")) {
    result.woff2 = Buffer.from(await toWoff2(ttf));
  }

  if (options.template) {
    const { renderTemplates } = await import("./renderTemplates");
    const { templates, usedBuildInTemplate } = renderTemplates(options, result, formats);

    if (templates.length > 0) {
      result.templates = templates;
      result.template = templates[0]?.content;
      result.usedBuildInTemplate = usedBuildInTemplate;
    }
  }

  if (!formats.includes("svg")) {
    delete result.svg;
  }

  if (!formats.includes("ttf")) {
    delete result.ttf;
  }

  if (!formats.includes("otf")) {
    delete result.otf;
  }

  return result;
};
