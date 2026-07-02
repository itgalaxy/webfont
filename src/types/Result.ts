import type { DecompressedFont } from "./DecompressedFont";
import type { GlyphData } from "./GlyphData";
import type { RenderedTemplate } from "./RenderedTemplate";
import type { ResultConfig } from "./ResultConfig";
import type { TranscodedFont } from "./TranscodedFont";

export type { DecompressedFont } from "./DecompressedFont";
export type { TranscodedFont } from "./TranscodedFont";

export type Result = {
  config?: ResultConfig;
  decompressedFonts?: DecompressedFont[];
  transcodedFonts?: TranscodedFont[];
  eot?: Buffer;
  glyphsData?: Array<GlyphData>;
  hash?: string;
  otf?: Buffer;
  svg?: string | Buffer;
  template?: string;
  templates?: RenderedTemplate[];
  ttf?: Buffer;
  usedBuildInTemplate?: boolean;
  woff?: Buffer;
  woff2?: Buffer;
};
