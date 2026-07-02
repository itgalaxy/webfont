import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { OptionsBase } from "./OptionsBase";

export type InitialOptions = OptionsBase & {
  files: string | Array<string>;
  glyphTransformFn?: GlyphTransformFn;
};
