import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { OptionsBase } from "./OptionsBase";

export type InitialOptions = OptionsBase & {
  filePath?: string;
  files: string | Array<string>;
  glyphTransformFn?: GlyphTransformFn;
};
