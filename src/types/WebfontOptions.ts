import type { Formats, FormatsOptions } from "./Format";
import type { GlyphContentTransformFn } from "./GlyphContentTransformFn";
import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { InitialOptions } from "./InitialOptions";
import type { MetadataProvider } from "./MetadataProvider";

export interface WebfontOptions extends InitialOptions {
  centerHorizontally: boolean;
  descent: number;
  fixedWidth: boolean;
  fontHeight: unknown;
  fontId: unknown;
  fontName: string;
  fontStyle: string;
  fontWeight: string;
  formats: Formats;
  formatsOptions: FormatsOptions;
  glyphTransformFn?: GlyphTransformFn;
  glyphContentTransformFn?: GlyphContentTransformFn;
  ligatures: boolean;
  maxConcurrency: number;
  metadata: unknown;
  metadataProvider?: MetadataProvider;
  normalize: boolean;
  prependUnicode: boolean;
  round: string | number;
  sort: boolean;
  startUnicode: number;
  template?: string;
  templateCacheString?: unknown;
  templateClassName?: unknown;
  templateFontName?: unknown;
  templateFontPath: string;
  verbose: boolean;
  addHashInFontUrl?: boolean;
}
