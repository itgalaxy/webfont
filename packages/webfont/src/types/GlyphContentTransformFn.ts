import type { GlyphData } from "./GlyphData";

export type GlyphContentTransformFn = (_glyph: GlyphData) => string | Promise<string>;
