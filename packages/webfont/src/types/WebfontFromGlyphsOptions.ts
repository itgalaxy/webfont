import type { GlyphContentTransformFn } from "./GlyphContentTransformFn";
import type { GlyphInput } from "./GlyphInput";
import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { MetadataProvider } from "./MetadataProvider";
import type { OptionsBase } from "./OptionsBase";

export type WebfontFromGlyphsOptions = OptionsBase & {
  glyphs: GlyphInput[];
  glyphContentTransformFn?: GlyphContentTransformFn;
  glyphTransformFn?: GlyphTransformFn;
  metadataProvider?: MetadataProvider;
};
