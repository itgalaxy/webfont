import xml2js from "xml2js";
import pLimit from "../lib/p-limit";
import { fileSorter, getMetadataServiceOptions } from "../lib/svgicons2svgfont";
import { createMetadataFromSrcPathService } from "../lib/svgicons2svgfont/metadataFromSrcPath";
import type { GlyphData, GlyphMetadata, WebfontOptions } from "../types";
import type { GlyphInput } from "../types/GlyphInput";
import type { FileMetadata } from "../types/MetadataProvider";

const normalizeUnicode = (unicode: string | string[] | undefined): string[] => {
  if (unicode === undefined) {
    return [];
  }

  if (Array.isArray(unicode)) {
    return unicode;
  }

  return [unicode];
};

const toGlyphMetadata = (metadata: FileMetadata): GlyphMetadata & { unicode: string[] } => ({
  name: metadata.name,
  unicode: normalizeUnicode(metadata.unicode),
});

const parseSvgContents = (glyphContents: string, srcPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (glyphContents.length === 0) {
      reject(new Error(`Empty glyph ${srcPath}`));
      return;
    }

    const xmlParser = new xml2js.Parser();

    xmlParser.parseString(glyphContents, (error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

export const getGlyphsDataFromInputs = async (
  inputs: readonly GlyphInput[],
  options: WebfontOptions,
): Promise<GlyphData[]> => {
  const metadataProvider =
    options.metadataProvider || createMetadataFromSrcPathService(getMetadataServiceOptions(options));
  const throttle = pLimit(options.maxConcurrency);

  let glyphsData = await Promise.all(
    inputs.map((input, index) =>
      throttle(async () => {
        const srcPath = input.srcPath ?? `glyph-${index + 1}.svg`;
        await parseSvgContents(input.contents, srcPath);

        const glyphData: GlyphData = {
          contents: input.contents,
          srcPath,
        };

        return glyphData;
      }),
    ),
  );

  if (options.sort) {
    glyphsData = [...glyphsData].sort((fileA, fileB) => fileSorter(fileA.srcPath, fileB.srcPath));
  }

  const { ligatures } = options;

  return Promise.all(
    glyphsData.map(
      (glyphData) =>
        new Promise<GlyphData>((resolve, reject) => {
          metadataProvider(glyphData.srcPath, (error, metadata) => {
            if (error) {
              reject(error);
              return;
            }

            if (!metadata) {
              reject(new Error(`Missing metadata for ${glyphData.srcPath}`));
              return;
            }

            const glyphMetadata = toGlyphMetadata(metadata);

            if (ligatures) {
              glyphMetadata.unicode.push(metadata.name.replace(/-/gu, "_"));
            }

            glyphData.metadata = glyphMetadata;

            resolve(glyphData);
          });
        }),
    ),
  );
};
