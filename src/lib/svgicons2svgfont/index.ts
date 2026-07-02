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

/**
 * Coerce `round` for svgicons2svgfont; accepts number or numeric string (CLI/config).
 * Returns undefined for undefined/null/empty/non-numeric/non-finite inputs.
 */
export const normalizeRoundOption = (round: string | number | null | undefined): number | undefined => {
  if (round === undefined || round === null) {
    return undefined;
  }

  if (typeof round === "number") {
    if (Number.isFinite(round)) {
      return round;
    }

    return undefined;
  }

  const trimmed = round.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return undefined;
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
