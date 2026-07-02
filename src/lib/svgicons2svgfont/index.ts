/* eslint-disable sort-imports, no-duplicate-imports -- type and value imports from svgicons2svgfont */

import type { SVGIcons2SVGFontStreamOptions } from "svgicons2svgfont";
import { fileSorter, getMetadataService, SVGIcons2SVGFontStream } from "svgicons2svgfont";
/* eslint-enable sort-imports, no-duplicate-imports */
import type { WebfontOptions } from "../../types";

export { fileSorter, getMetadataService, SVGIcons2SVGFontStream };

type MetadataServiceOptions = {
  prependUnicode: boolean;
  startUnicode: number;
};

export const getMetadataServiceOptions = (options: WebfontOptions): MetadataServiceOptions => ({
  prependUnicode: Boolean(options.prependUnicode),
  startUnicode: Number(options.startUnicode),
});

export const getFontStreamOptions = (options: WebfontOptions): Partial<SVGIcons2SVGFontStreamOptions> =>
  ({
    ascent: options.ascent,
    centerHorizontally: options.centerHorizontally,
    descent: options.descent,
    fixedWidth: options.fixedWidth,
    fontHeight: options.fontHeight,
    fontId: options.fontId,
    fontName: options.fontName,
    fontStyle: options.fontStyle,
    fontWeight: options.fontWeight,
    metadata: options.metadata,
    normalize: options.normalize,
    round: options.round,
  }) as unknown as Partial<SVGIcons2SVGFontStreamOptions>;
