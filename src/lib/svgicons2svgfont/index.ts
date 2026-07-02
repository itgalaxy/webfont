import type {WebfontOptions} from "../../types";
/* eslint-disable sort-imports -- v10 uses internal paths; v16 will switch to public named exports */
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import fileSorter from "svgicons2svgfont/src/filesorter";
import getMetadataService from "svgicons2svgfont/src/metadata";
/* eslint-enable sort-imports */

export {fileSorter, getMetadataService, SVGIcons2SVGFontStream};

type MetadataServiceOptions = {
  prependUnicode: boolean;
  startUnicode: number;
};

export const getMetadataServiceOptions = (options: WebfontOptions): MetadataServiceOptions => ({
  prependUnicode: Boolean(options.prependUnicode),
  startUnicode: Number(options.startUnicode),
});

type FontStreamOptions = {
  ascent?: WebfontOptions["ascent"];
  centerHorizontally?: WebfontOptions["centerHorizontally"];
  descent?: WebfontOptions["descent"];
  fixedWidth?: WebfontOptions["fixedWidth"];
  fontHeight?: WebfontOptions["fontHeight"];
  fontId?: WebfontOptions["fontId"];
  fontName?: WebfontOptions["fontName"];
  fontStyle?: WebfontOptions["fontStyle"];
  fontWeight?: WebfontOptions["fontWeight"];
  // eslint-disable-next-line no-unused-vars
  log?: (...args: unknown[]) => void;
  metadata?: WebfontOptions["metadata"];
  normalize?: WebfontOptions["normalize"];
  round?: WebfontOptions["round"];
};

export const getFontStreamOptions = (options: WebfontOptions): FontStreamOptions => {
  const fontStreamOptions: FontStreamOptions = {
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
  };

  if (options.verbose) {
    // eslint-disable-next-line no-console
    fontStreamOptions.log = console.log.bind(console);
  }

  return fontStreamOptions;
};
