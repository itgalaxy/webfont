import {GlyphTransformFn} from "./GlyphTransformFn";
import {OptionsBase} from "./OptionsBase";

export type InitialOptions = OptionsBase & {
  filePath?: string;
  files: string | Array<string>;
  glyphTransformFn?: GlyphTransformFn;
};
