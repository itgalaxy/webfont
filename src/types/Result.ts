import type { GlyphData } from "./GlyphData";
import type { ResultConfig } from "./ResultConfig";

export type Result = {
  config?: ResultConfig;
  eot?: Buffer;
  glyphsData?: Array<GlyphData>;
  hash?: string;
  otf?: Buffer;
  svg?: string | Buffer;
  template?: string;
  ttf?: Buffer;
  usedBuildInTemplate?: boolean;
  woff?: Buffer;
  woff2?: Buffer;
};
