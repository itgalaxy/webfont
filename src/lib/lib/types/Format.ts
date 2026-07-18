export type Format = "eot" | "woff" | "woff2" | "svg" | "ttf";
export type Formats = Array<Format>;
type FormatOption = {
  copyright: null,
  ts: null,
  version: null
}
export type FormatsOptions = Partial<Record<Format, FormatOption>>;
