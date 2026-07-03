import type { InitialOptions } from "../types/InitialOptions";
import type { WebfontOptions } from "../types/WebfontOptions";
import { defaultWebfontOptions } from "./defaultOptions";

type OptionsGetter = (_initialOptions?: InitialOptions) => WebfontOptions;

export const getOptions: OptionsGetter = (initialOptions) => {
  if (!initialOptions?.files) {
    throw new Error("You must pass webfont a `files` glob");
  }

  return {
    ...defaultWebfontOptions(),
    ...initialOptions,
  } as WebfontOptions;
};
