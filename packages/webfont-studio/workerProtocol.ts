import type { Format } from "@webfont/types/Format";
import type { GlyphInput } from "@webfont/types/GlyphInput";
import type { StudioSvgToolsOptions } from "./studioSvgTools";

export const CONVERSION_STEPS = [
  { id: "read", label: "Read SVG files" },
  { id: "validate", label: "Validate SVGs and metadata" },
  { id: "generate", label: "Generate font outputs" },
  { id: "encode", label: "Encode selected formats" },
  { id: "preview", label: "Prepare preview" },
] as const;

export type ConversionStepId = (typeof CONVERSION_STEPS)[number]["id"];

export type GlyphPreview = {
  srcPath: string;
  name?: string;
  unicode?: string[];
};

export type WorkerFontOutputs = {
  svg?: string;
  ttf?: ArrayBuffer;
  woff?: ArrayBuffer;
  woff2?: ArrayBuffer;
};

export type GlyphMappingMetadata = {
  srcPath: string;
  name: string;
  unicode: string[];
};

export type WorkerConvertRequest = {
  id: string;
  glyphs: GlyphInput[];
  formats: Format[];
  verbose: boolean;
  glyphMappings?: GlyphMappingMetadata[];
  normalize?: boolean;
  centerHorizontally?: boolean;
  fixedWidth?: boolean;
  /** Alpha. SVG diagnostics and optional browser WASM outline-stroke fix. */
  svgTools?: StudioSvgToolsOptions;
};

export type WorkerProgressMessage = {
  type: "progress";
  id: string;
  label: string;
  step: ConversionStepId;
  completedSteps: ConversionStepId[];
  percent?: number;
  busy?: boolean;
};

export type WorkerDebugMessage = {
  type: "debug";
  id: string;
  message: string;
  elapsedMs?: number;
};

export type WorkerLifecycleMessage = {
  type: "lifecycle";
  id: string;
  state: "started" | "finished";
  elapsedMs?: number;
};

export type WorkerResultMessage = {
  type: "result";
  id: string;
  hash?: string;
  formats: Format[];
  glyphsPreview: GlyphPreview[];
  outputs: WorkerFontOutputs;
};

export type WorkerErrorMessage = {
  type: "error";
  id: string;
  message: string;
};

export type WorkerOutboundMessage =
  | WorkerProgressMessage
  | WorkerDebugMessage
  | WorkerLifecycleMessage
  | WorkerResultMessage
  | WorkerErrorMessage;

export type WorkerConversionResult = {
  hash?: string;
  formats: Format[];
  glyphsPreview: GlyphPreview[];
  outputs: {
    svg?: string;
    ttf?: Uint8Array;
    woff?: Uint8Array;
    woff2?: Uint8Array;
  };
};
