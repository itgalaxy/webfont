import type { SVGIcons2SVGFontStreamOptions } from "svgicons2svgfont";
import { fileSorter, getMetadataService, SVGIcons2SVGFontStream } from "svgicons2svgfont";
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

/** Coerce `round` for svgicons2svgfont; accepts number or numeric string (CLI/config). */
export const normalizeRoundOption = (round: string | number | undefined): number | undefined => {
  if (round === undefined) {
    return undefined;
  }

  if (typeof round === "number") {
    return round;
  }

  const parsed = Number(round);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
};

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
    round: normalizeRoundOption(options.round),
  }) as unknown as Partial<SVGIcons2SVGFontStreamOptions>;
