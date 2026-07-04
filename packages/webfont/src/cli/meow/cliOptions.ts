export const WEBFONT_CLI_HELP_MARKERS = [
  "Usage: webfont [input] [options]",
  "--config",
  "--fontName",
  "--formats",
  "--dest-create",
  "--no-sort",
  "--ligatures",
  "--unicode-range",
  "--no-template-font-ligatures",
  "--addHashInFontUrl",
  "--optimize-svg",
  "svg-diagnose",
] as const;

export { webfontCliHelpText } from "./cliHelpText.mjs";

export const webfontMeowFlags = {
  ascent: {
    type: "string",
  },
  centerHorizontally: {
    type: "boolean",
  },
  centerVertically: {
    type: "boolean",
  },
  config: {
    type: "string",
  },
  descent: {
    type: "string",
  },
  dest: {
    shortFlag: "d",
    default: process.cwd(),
    type: "string",
  },
  destCreate: {
    shortFlag: "m",
    default: false,
    type: "boolean",
  },
  destTemplate: {
    shortFlag: "s",
    type: "string",
  },
  fixedWidth: {
    type: "boolean",
  },
  fontHeight: {
    type: "string",
  },
  fontId: {
    type: "string",
  },
  fontName: {
    shortFlag: "u",
    type: "string",
  },
  fontStyle: {
    type: "string",
  },
  fontWeight: {
    type: "string",
  },
  formats: {
    shortFlag: "f",
    type: "string",
  },
  help: {
    shortFlag: "h",
    type: "boolean",
  },
  ligatures: {
    default: false,
    type: "boolean",
  },
  metadata: {
    type: "string",
  },
  normalize: {
    type: "boolean",
  },
  prependUnicode: {
    type: "boolean",
  },
  round: {
    type: "string",
  },
  sort: {
    default: true,
    type: "boolean",
  },
  startUnicode: {
    type: "string",
  },
  template: {
    shortFlag: "t",
    type: "string",
  },
  templateClassName: {
    shortFlag: "c",
    type: "string",
  },
  templateFontName: {
    shortFlag: "n",
    type: "string",
  },
  addHashInFontUrl: {
    default: false,
    type: "boolean",
  },
  optimizeSvg: {
    default: false,
    type: "boolean",
  },
  templateFontPath: {
    shortFlag: "p",
    type: "string",
  },
  templateCacheString: {
    default: "",
    type: "string",
  },
  unicodeRange: {
    default: false,
    type: "boolean",
  },
  templateFontLigatures: {
    default: true,
    type: "boolean",
  },
  verbose: {
    default: false,
    type: "boolean",
  },
  svgDiagnose: {
    default: false,
    type: "boolean",
  },
  version: {
    shortFlag: "v",
    type: "boolean",
  },
} as const;
