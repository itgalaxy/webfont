import type { MetadataProvider } from "@webfont/types/MetadataProvider";
import type { GlyphMappingMetadata } from "./workerProtocol";

export const createMetadataFromMapping = (mappings: readonly GlyphMappingMetadata[]): MetadataProvider => {
  const byPath = new Map(mappings.map((entry) => [entry.srcPath, entry]));

  return (srcPath, callback) => {
    const entry = byPath.get(srcPath);

    if (!entry) {
      callback(new Error(`Missing glyph mapping for ${srcPath}`));
      return;
    }

    callback(null, {
      name: entry.name,
      unicode: entry.unicode,
    });
  };
};
