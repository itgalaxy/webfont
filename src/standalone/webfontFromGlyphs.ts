import type { Result } from "../types/Result";
import type { WebfontFromGlyphsOptions } from "../types/WebfontFromGlyphsOptions";
import { getGlyphsDataFromInputs } from "./getGlyphsDataFromInputs";
import { assertSvgPipelineFormats } from "./inputMode";
import { getOptionsFromGlyphs } from "./optionsFromGlyphs";
import { runSvgPipeline } from "./runSvgPipeline";
import { validateWebfontOptions } from "./validateWebfontOptions";

export const webfontFromGlyphs = async (initialOptions: WebfontFromGlyphsOptions): Promise<Result> => {
  let options = getOptionsFromGlyphs(initialOptions);
  options = validateWebfontOptions(options);

  assertSvgPipelineFormats(options.formats);

  const glyphsData = await getGlyphsDataFromInputs(initialOptions.glyphs, options);

  return runSvgPipeline(glyphsData, options);
};
