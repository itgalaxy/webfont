export type Format = "eot" | "otf" | "woff" | "woff2" | "svg" | "ttf";
export type Formats = Array<Format>;
// Mirrors svg2ttf's FontOptions (the only format currently consuming these
// options). Fields are optional and accept `null` because webfont's defaults
// seed them as `null` ("let svg2ttf pick"), while callers pass concrete values.
type FormatOption = {
  copyright?: string | null;
  description?: string | null;
  ts?: number | null;
  url?: string | null;
  version?: string | null;
};
export type FormatsOptions = Partial<Record<Format, FormatOption>>;
