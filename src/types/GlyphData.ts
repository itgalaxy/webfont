import type { GlyphMetadata } from "./GlyphMetadata";

export type GlyphData = {
  contents: string;
  metadata?: GlyphMetadata;
  srcPath: string;
};
