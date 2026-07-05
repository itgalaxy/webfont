import type { MetadataProvider } from "../../types/MetadataProvider";

type MetadataServiceOptions = {
  prependUnicode: boolean;
  startUnicode: number;
};

/**
 * Browser-safe metadata lookup from a virtual `srcPath` (no `fs`, no file rename).
 * Mirrors {@link https://github.com/nfroidure/svgicons2svgfont | svgicons2svgfont} filename rules.
 */
export const createMetadataFromSrcPathService = (
  options: Partial<MetadataServiceOptions> = {},
): MetadataProvider => {
  const usedUnicodes: string[] = [];
  let startUnicode = 0xea01;

  if (typeof options.startUnicode === "number") {
    startUnicode = options.startUnicode;
  }

  const serviceOptions = {
    prependUnicode: Boolean(options.prependUnicode),
    startUnicode,
  };

  return (file, callback) => {
    const fileBasename = file.split(/[/\\]/u).pop() ?? file;
    const metadata = {
      path: file,
      name: "",
      unicode: [] as string[],
      renamed: false,
    };

    const matches = fileBasename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/iu);

    metadata.name = matches?.[2] ?? `icon${serviceOptions.startUnicode}`;

    if (matches?.[1]) {
      metadata.unicode = matches[1].split(",").map((match) => {
        const hex = match.slice(1);

        return hex
          .split("u")
          .map((code) => String.fromCodePoint(Number.parseInt(code, 16)))
          .join("");
      });

      if (usedUnicodes.includes(metadata.unicode[0] ?? "")) {
        callback(
          new Error(
            `The unicode codepoint of the glyph ${metadata.name} seems to be already used by another glyph.`,
          ),
        );
        return;
      }

      usedUnicodes.push(...metadata.unicode);
    } else {
      let nextUnicode = serviceOptions.startUnicode;

      do {
        metadata.unicode[0] = String.fromCodePoint(nextUnicode);
        nextUnicode += 1;
        serviceOptions.startUnicode = nextUnicode;
      } while (usedUnicodes.includes(metadata.unicode[0] ?? ""));

      usedUnicodes.push(metadata.unicode[0] ?? "");

      if (serviceOptions.prependUnicode) {
        callback(
          new Error(
            "prependUnicode renames files on disk and is not supported in the browser demo; disable prependUnicode or embed unicode prefixes in filenames.",
          ),
        );
        return;
      }
    }

    callback(null, metadata);
  };
};
