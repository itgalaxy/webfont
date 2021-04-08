import {GlyphData} from "./GlyphData";
import {OptionsBase} from "./OptionsBase";

export type Result = {
  config?: OptionsBase;
  eot?: Buffer;
  glyphsData?: Array<GlyphData>;
  hash?: string;
  svg?: string | Buffer;
  template?: string;
  ttf?: Buffer;
  usedBuildInTemplate?: boolean;
  woff?: Buffer;
  woff2?: Buffer;
}
