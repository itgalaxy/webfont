import path from "path";

const HTTP_URL_PATTERN = /^https?:\/\//iu;

export const isHttpUrl = (value: string): boolean => HTTP_URL_PATTERN.test(value);

export const getInputExtension = (source: string): string => {
  if (isHttpUrl(source)) {
    try {
      return path.extname(new URL(source).pathname).toLowerCase();
    } catch {
      return "";
    }
  }

  return path.extname(source).toLowerCase();
};

export const getWebfontSourceBasename = (source: string): string => {
  let pathname = source;

  if (isHttpUrl(source)) {
    pathname = new URL(source).pathname;
  }

  const filename = path.basename(pathname);
  const extension = getInputExtension(source);

  if (extension === ".woff2") {
    return filename.slice(0, -".woff2".length);
  }

  if (extension === ".woff") {
    return filename.slice(0, -".woff".length);
  }

  return filename.replace(/\.[^.]+$/u, "");
};

const WEBFONT_CONTAINER_SUFFIX: Record<string, string> = {
  ".woff": "-woff",
  ".woff2": "-woff2",
};

export const resolveDecompressedFontBasenames = (sources: readonly string[]): string[] => {
  const stripped = sources.map((source) => getWebfontSourceBasename(source));
  const basenameCounts = new Map<string, number>();

  for (const basename of stripped) {
    basenameCounts.set(basename, (basenameCounts.get(basename) ?? 0) + 1);
  }

  return sources.map((source, index) => {
    const basename = stripped[index];
    const isDuplicate = (basenameCounts.get(basename) ?? 0) > 1;
    const extension = getInputExtension(source);

    if (!isDuplicate) {
      return basename;
    }

    return `${basename}${WEBFONT_CONTAINER_SUFFIX[extension] ?? `-${index + 1}`}`;
  });
};
