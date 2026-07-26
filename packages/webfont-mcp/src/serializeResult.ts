import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Result } from "webfont";

export type SerializedConversionResult = {
  dest: string;
  glyphCount: number;
  hash?: string;
  svgDiagnostics?: Result["svgDiagnostics"];
  writtenFiles: string[];
};

export const serializeConversionResult = async (
  result: Result,
  dest: string,
): Promise<SerializedConversionResult> => {
  const entries = await readdir(dest);

  return {
    dest,
    glyphCount: result.glyphsData?.length ?? 0,
    hash: result.hash,
    svgDiagnostics: result.svgDiagnostics,
    writtenFiles: entries.map((entry) => join(dest, entry)).sort(),
  };
};
