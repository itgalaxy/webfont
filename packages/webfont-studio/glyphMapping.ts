export type GlyphMappingRow = {
  srcPath: string;
  name: string;
  /** Uppercase hex without U+ prefix, e.g. EA01 */
  unicodeHex: string;
};

const DEFAULT_START_UNICODE = 0xea01;

const basename = (srcPath: string): string => srcPath.split(/[/\\]/u).pop() ?? srcPath;

const parseFilenameUnicode = (fileBasename: string): string[] | undefined => {
  const matches = fileBasename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/iu);

  if (!matches?.[1]) {
    return undefined;
  }

  return matches[1].split(",").map((match) => {
    const hex = match.slice(1);

    return hex
      .split("u")
      .map((code) => String.fromCodePoint(Number.parseInt(code, 16)))
      .join("");
  });
};

const glyphNameFromFilename = (fileBasename: string, fallbackIndex: number): string => {
  const matches = fileBasename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/iu);

  if (matches?.[2]) {
    return matches[2];
  }

  return `icon${fallbackIndex}`;
};

export const formatUnicodeLabel = (unicodeHex: string): string => `U+${unicodeHex.toUpperCase().padStart(4, "0")}`;

export const normalizeUnicodeHexInput = (input: string): string => {
  const trimmed = input.trim().replace(/^U\+/iu, "").replace(/^0x/iu, "");

  if (trimmed.length === 0) {
    throw new Error("Unicode code point is required");
  }

  if (!/^[0-9a-f]{1,6}$/iu.test(trimmed)) {
    throw new Error(`Invalid Unicode: ${input}`);
  }

  const codePoint = Number.parseInt(trimmed, 16);

  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    throw new Error(`Unicode out of range: ${input}`);
  }

  return codePoint.toString(16).toUpperCase();
};

export const unicodeHexToChar = (unicodeHex: string): string =>
  String.fromCodePoint(Number.parseInt(unicodeHex, 16));

export const charToUnicodeHex = (input: string): string => {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error("Character is required");
  }

  const codePoint = trimmed.codePointAt(0);

  if (codePoint === undefined) {
    throw new Error("Character is required");
  }

  return codePoint.toString(16).toUpperCase();
};

export const tryFormatUnicodeLabel = (unicodeHex: string): string | undefined => {
  try {
    return formatUnicodeLabel(normalizeUnicodeHexInput(unicodeHex));
  } catch {
    return undefined;
  }
};

export const tryUnicodeHexToChar = (unicodeHex: string): string | undefined => {
  try {
    return unicodeHexToChar(normalizeUnicodeHexInput(unicodeHex));
  } catch {
    return undefined;
  }
};

export const buildDefaultGlyphMappings = (srcPaths: readonly string[]): GlyphMappingRow[] => {
  const usedUnicodes: string[] = [];
  let nextUnicode = DEFAULT_START_UNICODE;

  return srcPaths.map((srcPath, index) => {
    const fileBasename = basename(srcPath);
    const name = glyphNameFromFilename(fileBasename, index + 1);
    const fromFilename = parseFilenameUnicode(fileBasename);

    if (fromFilename?.[0]) {
      const codePoint = fromFilename[0].codePointAt(0);

      if (codePoint !== undefined) {
        const hex = codePoint.toString(16).toUpperCase();
        usedUnicodes.push(fromFilename[0]);
        return { srcPath, name, unicodeHex: hex };
      }
    }

    let hex = "";

    do {
      hex = nextUnicode.toString(16).toUpperCase();
      nextUnicode += 1;
    } while (usedUnicodes.includes(unicodeHexToChar(hex)));

    usedUnicodes.push(unicodeHexToChar(hex));

    return { srcPath, name, unicodeHex: hex };
  });
};

export const validateGlyphMappings = (rows: readonly GlyphMappingRow[]): string | undefined => {
  const seen = new Map<string, string>();

  for (const row of rows) {
    let hex: string;

    try {
      hex = normalizeUnicodeHexInput(row.unicodeHex);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `${row.srcPath}: ${message}`;
    }

    const label = formatUnicodeLabel(hex);
    const previous = seen.get(label);

    if (previous) {
      return `Duplicate ${label} for ${row.srcPath} and ${previous}`;
    }

    seen.set(label, row.srcPath);

    if (row.name.trim().length === 0) {
      return `Glyph name is required for ${row.srcPath}`;
    }
  }

  return undefined;
};

export const glyphMappingsToMetadata = (
  rows: readonly GlyphMappingRow[],
): Array<{ srcPath: string; name: string; unicode: string[] }> =>
  rows.map((row) => {
    const unicodeHex = normalizeUnicodeHexInput(row.unicodeHex);

    return {
      srcPath: row.srcPath,
      name: row.name.trim(),
      unicode: [unicodeHexToChar(unicodeHex)],
    };
  });
