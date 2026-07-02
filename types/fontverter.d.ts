declare module "fontverter" {
  export type FontFormat = "sfnt" | "woff" | "woff2";

  export function detectFormat(buffer: Buffer): FontFormat;

  export function convert(buffer: Buffer, toFormat: FontFormat, fromFormat?: FontFormat): Promise<Buffer>;
}
