import type { GlyphMetadata } from "./GlyphMetadata";

export type GlyphTransformFn = (_obj: GlyphMetadata) => GlyphMetadata | Promise<GlyphMetadata>;
