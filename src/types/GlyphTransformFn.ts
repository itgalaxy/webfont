import {GlyphMetadata} from "./GlyphMetadata";

// eslint-disable-next-line no-unused-vars
export type GlyphTransformFn = (obj: GlyphMetadata) => GlyphMetadata | Promise<GlyphMetadata>;
