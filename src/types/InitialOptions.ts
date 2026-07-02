import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { MetadataProvider } from "./MetadataProvider";
import type { OptionsBase } from "./OptionsBase";

export type InitialOptions = OptionsBase & {
  files: string | Array<string>;
  glyphTransformFn?: GlyphTransformFn;
  metadataProvider?: MetadataProvider;
};
