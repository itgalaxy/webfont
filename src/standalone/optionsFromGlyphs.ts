import type { WebfontFromGlyphsOptions } from "../types/WebfontFromGlyphsOptions";
import type { WebfontOptions } from "../types/WebfontOptions";
import { defaultWebfontOptions } from "./defaultOptions";

export const getOptionsFromGlyphs = (initialOptions: WebfontFromGlyphsOptions): WebfontOptions => {
  if (!initialOptions.glyphs?.length) {
    throw new Error("You must pass webfont at least one SVG glyph");
  }

  const { glyphs: _glyphs, ...rest } = initialOptions;

  return {
    ...defaultWebfontOptions(),
    ...rest,
    files: initialOptions.glyphs.map((glyph, index) => glyph.srcPath ?? `glyph-${index + 1}.svg`),
  } as WebfontOptions;
};
