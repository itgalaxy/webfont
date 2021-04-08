import {GlyphMetadata} from "./GlyphMetadata";

// eslint-disable-next-line no-unused-vars
export type GlyphTransformFn = (obj: GlyphMetadata) => Record<"name", string>;
