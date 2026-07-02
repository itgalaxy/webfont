import type { InitialOptions } from "../types/InitialOptions";
import type { WebfontOptions } from "../types/WebfontOptions";

type OptionsGetter = (_initialOptions?: InitialOptions) => WebfontOptions;

export const getOptions: OptionsGetter = (initialOptions) => {
  if (!initialOptions?.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  return {
    centerHorizontally: false,
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
    ligatures: true,

    /*
     * Maybe allow setup from CLI
     * This is usually less than file read maximums while staying performance
     */
    maxConcurrency: 100,
    metadata: undefined,
    metadataProvider: null,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    sort: true,
    startUnicode: 0xea01,
    templateFontPath: "./",
    verbose: false,
    ...initialOptions,
  } as WebfontOptions;
};
