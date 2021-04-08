import type {FormatsOptions} from "./Format";
import type {InitialOptions} from "./InitialOptions";

export interface WebfontOptions extends InitialOptions {
  formatsOptions: FormatsOptions,
  maxConcurrency: number,
  metadataProvider: null,
}
