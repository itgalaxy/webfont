import type { Formats, FormatsOptions } from "./Format";
import type { GlyphTransformFn } from "./GlyphTransformFn";
import type { InitialOptions } from "./InitialOptions";

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
  ligatures: boolean;
  maxConcurrency: number;
  metadata: unknown;
  metadataProvider: null;
  normalize: boolean;
  prependUnicode: boolean;
  round: number;
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
