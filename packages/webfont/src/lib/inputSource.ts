import { globby } from "globby";
import { isHttpUrl } from "./inputSourceUtils";

export {
  getInputExtension,
  getWebfontSourceBasename,
  isHttpUrl,
  resolveDecompressedFontBasenames,
} from "./inputSourceUtils";

export const resolveInputSources = async (patterns: readonly string[]): Promise<string[]> => {
  const resolved = await Promise.all(
    patterns.map((pattern) => {
      if (isHttpUrl(pattern)) {
        return Promise.resolve([pattern]);
      }

      return globby(pattern);
    }),
  );

  return resolved.flat();
};
