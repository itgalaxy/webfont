import { Readable } from "stream";
import { getFontStreamOptions, SVGIcons2SVGFontStream } from "../lib/svgicons2svgfont";
import type { GlyphData, GlyphMetadata, WebfontOptions } from "../types";

type GlyphReadable = Readable & { metadata: GlyphMetadata };

export const generateSvgFont = (glyphsData: GlyphData[], options: WebfontOptions): Promise<string> => {
  let result = "";

  return new Promise<string>((resolve, reject) => {
    if (options.verbose) {
      // biome-ignore lint/suspicious/noConsole: verbose SVG generation progress
      console.log("Generating SVG font...");
    }

    const fontStream = new SVGIcons2SVGFontStream(getFontStreamOptions(options))
      .on("finish", () => resolve(result))
      .on("data", (data) => {
        result += data;
      })
      .on("error", (error) => reject(error));

    glyphsData.forEach((glyphData) => {
      const glyphStream: GlyphReadable = new Readable() as GlyphReadable;

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);
      glyphStream.metadata = glyphData.metadata ?? { name: "", unicode: [] };

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
};
