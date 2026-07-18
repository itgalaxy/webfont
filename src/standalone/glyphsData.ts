import type {GlyphData, WebfontOptions} from "../types";
import { createReadStream } from "fs";
import fileSorter from "svgicons2svgfont/src/filesorter";
import getMetadataService from "svgicons2svgfont/src/metadata";
import pLimit from "p-limit";
import xml2js from "xml2js";

// eslint-disable-next-line no-unused-vars
type GlyphsDataGetter = (files: Array<GlyphData["srcPath"]>, options: WebfontOptions) => unknown;

export const getGlyphsData : GlyphsDataGetter = (files, options) => {
  const metadataProvider =
    options.metadataProvider ||
    getMetadataService({
      prependUnicode: options.prependUnicode,
      startUnicode: options.startUnicode,
    });

  const xmlParser = new xml2js.Parser();
  const throttle = pLimit(options.maxConcurrency);

  return Promise.all(files.map((srcPath: GlyphData["srcPath"]) => throttle(() => new Promise((resolve, reject) => {
    const glyph = createReadStream(srcPath);
    let glyphContents = "";

    // eslint-disable-next-line no-promise-executor-return
    return glyph.
      on("error", (glyphError) => reject(glyphError)).
      on("data", (data) => {
        glyphContents += data.toString();
      }).
      on("end", () => {
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
  })))).then((glyphsData) => {

    let sortedGlyphsData = glyphsData;

    if (options.sort) {
      const sortCallback = (fileA: GlyphData, fileB: GlyphData) => fileSorter(fileA.srcPath, fileB.srcPath);
      sortedGlyphsData = glyphsData.sort(sortCallback);
    }

    const { ligatures } = options;

    return Promise.all(sortedGlyphsData.map((glyphData: GlyphData) => new Promise((resolve, reject) => {
      metadataProvider(glyphData.srcPath, (error, metadata) => {
        if (error) {
          return reject(error);
        }

        if (ligatures) {
          metadata.unicode.push(metadata.name.replace(/-/gu, "_"));
        }

        glyphData.metadata = metadata;

        return resolve(glyphData);
      });
    })));
  });
};
