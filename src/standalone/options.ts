import type {InitialOptions} from "../types/InitialOptions";
import {WebfontOptions} from "../types/WebfontOptions";

// eslint-disable-next-line no-unused-vars
type OptionsGetter = (initialOptions?: InitialOptions) => WebfontOptions;

export const getOptions: OptionsGetter = (initialOptions) => {
  if (!initialOptions || !initialOptions.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  return {
    centerHorizontally: false,
    descent: 0,
    fixedWidth: false,
    fontHeight: null,
    fontId: null,
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
    glyphTransformFn: null,
    ligatures: true,

    /*
     * Maybe allow setup from CLI
     * This is usually less than file read maximums while staying performance
     */
    maxConcurrency: 100,
    metadata: null,
    metadataProvider: null,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    sort: true,
    startUnicode: 0xea01,
    template: null,
    templateCacheString: null,
    templateClassName: null,
    templateFontName: null,
    templateFontPath: "./",
    verbose: false,
    ...initialOptions,
  };

};
