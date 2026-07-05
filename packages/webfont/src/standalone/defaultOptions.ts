import type { WebfontOptions } from "../types/WebfontOptions";

/** Shared defaults for Node (`files`) and in-memory (`glyphs`) entry points. */
export const defaultWebfontOptions = (): Omit<WebfontOptions, "files"> =>
  ({
    centerHorizontally: false,
    centerVertically: false,
    descent: 0,
    fixedWidth: false,
    fontHeight: undefined,
    fontId: undefined,
    fontName: "webfont",
    fontStyle: "",
    fontWeight: "",
    formats: ["svg", "ttf", "eot", "woff", "woff2"],
    formatsOptions: {
      ttf: {
        copyright: null,
        ts: null,
        version: null,
      },
    },
    ligatures: false,
    maxConcurrency: 100,
    metadata: undefined,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    sort: true,
    startUnicode: 0xea01,
    templateFontPath: "./",
    unicodeRange: false,
    verbose: false,
  }) as Omit<WebfontOptions, "files">;
