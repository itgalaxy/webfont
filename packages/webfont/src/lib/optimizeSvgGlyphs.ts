import type { Config } from "svgo";
import { optimize } from "svgo";

/** Conservative SVGO preset: cleanup cruft without rewriting paths or removing viewBox. */
export const defaultWebfontSvgoConfig = (): Config => ({
  multipass: false,
  plugins: [
    "removeDoctype",
    "removeXMLProcInst",
    "removeComments",
    "removeMetadata",
    "removeEditorsNSData",
    "removeDesc",
    "cleanupAttrs",
    "removeUnusedNS",
  ],
});

const resolveSvgoConfig = (userConfig?: Config): Config => {
  const defaults = defaultWebfontSvgoConfig();

  if (!userConfig) {
    return defaults;
  }

  return {
    ...defaults,
    ...userConfig,
    plugins: userConfig.plugins ?? defaults.plugins,
  };
};

export const optimizeSvgContents = (contents: string, srcPath: string, config?: Config): string => {
  const result = optimize(contents, {
    ...resolveSvgoConfig(config),
    path: srcPath,
  });

  return result.data;
};
