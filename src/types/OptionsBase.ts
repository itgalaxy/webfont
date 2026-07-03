import type { TemplateOption } from "../lib/parseTemplateOption";
import type { Formats } from "./Format";
import type { SvgToolsOptions } from "./SvgToolsOptions";

export type OptionsBase = {
  configFile?: string;
  dest?: string;
  destCreate?: boolean;
  fontName?: string | unknown;
  formats?: Formats;
  template?: TemplateOption;
  templateClassName?: string | unknown;
  templateFontPath?: string;
  templateFontName?: string | unknown;
  templateCacheString?: string | unknown;
  destTemplate?: string | unknown;
  verbose?: boolean;
  fontId?: string | unknown;
  fontStyle?: string | unknown;
  fontWeight?: string | unknown;
  fixedWidth?: string | unknown;
  centerHorizontally?: boolean | unknown;
  normalize?: boolean;
  fontHeight?: string | unknown;
  round?: string | number;
  descent?: string | number;
  ascent?: string;
  startUnicode?: string | unknown;
  prependUnicode?: boolean | unknown;
  metadata?: unknown;
  sort?: boolean;
  ligatures?: boolean;
  addHashInFontUrl?: boolean | unknown;
  unicodeRange?: boolean | string | unknown;
  optimizeSvg?: boolean | unknown;
  svgoConfig?: unknown;
  /** Alpha. SVG diagnostics and optional pre-conversion fixes. */
  svgTools?: SvgToolsOptions;
};
