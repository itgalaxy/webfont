import type { Config } from "svgo";
import type { GlyphData } from "../types/GlyphData";
import { optimizeSvgContents } from "./optimizeSvgGlyphs";

export const applyOptimizeSvgToGlyphs = (glyphs: GlyphData[], svgoConfig?: Config): GlyphData[] =>
  glyphs.map((glyph) => ({
    ...glyph,
    contents: optimizeSvgContents(glyph.contents, glyph.srcPath, svgoConfig),
  }));
