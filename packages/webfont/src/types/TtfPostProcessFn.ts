import type { Formats } from "./Format";

export type TtfPostProcessContext = {
  fontName: string;
  formats: Formats;
};

/**
 * Post-process the generated TTF buffer before webfont derives WOFF/WOFF2/EOT
 * from it. Runs only in the SVG pipeline. Return the (possibly rewritten) font
 * bytes. Enables optional, caller-owned steps such as autohinting without the
 * core taking a native dependency (see ADR 0011 for the analogous stroke case).
 */
export type TtfPostProcessFn = (
  _ttf: Buffer,
  _context: TtfPostProcessContext,
) => Buffer | Uint8Array | Promise<Buffer | Uint8Array>;
