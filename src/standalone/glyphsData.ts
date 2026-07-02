import { createReadStream } from "fs";
import xml2js from "xml2js";
import pLimit from "../lib/p-limit";
import { fileSorter, getMetadataService, getMetadataServiceOptions } from "../lib/svgicons2svgfont";
import type { GlyphData, GlyphMetadata, WebfontOptions } from "../types";

const normalizeUnicode = (unicode: GlyphMetadata["unicode"]): string[] => {
  if (Array.isArray(unicode)) {
    return unicode;
  }

  return [unicode];
};

const toGlyphMetadata = (metadata: {
  name: string;
  unicode: GlyphMetadata["unicode"] | string | string[];
}): GlyphMetadata => ({
  name: metadata.name,
  unicode: normalizeUnicode(metadata.unicode as GlyphMetadata["unicode"]),
});

type GlyphsDataGetter = (_files: Array<GlyphData["srcPath"]>, _options: WebfontOptions) => unknown;

export const getGlyphsData: GlyphsDataGetter = (files, options) => {
  const metadataProvider = options.metadataProvider || getMetadataService(getMetadataServiceOptions(options));

  const xmlParser = new xml2js.Parser();
  const throttle = pLimit(options.maxConcurrency);

  return Promise.all(
    files.map((srcPath: GlyphData["srcPath"]) =>
      throttle(
        () =>
          new Promise<GlyphData>((resolve, reject) => {
            const glyph = createReadStream(srcPath);
            let glyphContents = "";

            glyph
              .on("error", (glyphError) => reject(glyphError))
              .on("data", (data) => {
                glyphContents += data.toString();
              })
              .on("end", () => {
                // Maybe bug in xml2js
                if (glyphContents.length === 0) {
                  return reject(new Error(`Empty file ${srcPath}`));
                }

                return xmlParser.parseString(glyphContents, (error) => {
                  if (error) {
                    return reject(error);
                  }

                  const glyphData: GlyphData = {
                    contents: glyphContents,
                    srcPath,
                  };

                  return resolve(glyphData);
                });
              });
          }),
      ),
    ),
  ).then((glyphsData: GlyphData[]) => {
    let sortedGlyphsData = glyphsData;

    if (options.sort) {
      const sortCallback = (fileA: GlyphData, fileB: GlyphData) => fileSorter(fileA.srcPath, fileB.srcPath);
      sortedGlyphsData = glyphsData.sort(sortCallback);
    }

    const { ligatures } = options;

    return Promise.all(
      sortedGlyphsData.map(
        (glyphData: GlyphData) =>
          new Promise<GlyphData>((resolve, reject) => {
            metadataProvider(glyphData.srcPath, (error, metadata) => {
              if (error) {
                return reject(error);
              }

              const glyphMetadata = toGlyphMetadata(metadata);

              if (ligatures) {
                glyphMetadata.unicode.push(metadata.name.replace(/-/gu, "_"));
              }

              glyphData.metadata = glyphMetadata;

              return resolve(glyphData);
            });
          }),
      ),
    );
  });
};
