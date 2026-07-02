import { loadWebfontConfig } from "../standalone";
import type { OptionsBase } from "../types/OptionsBase";
import type { CliLike } from "./program";

type LoadedConfig = Awaited<ReturnType<typeof loadWebfontConfig>>;

const getFilesFromLoadedConfig = (loaded: LoadedConfig): string[] | undefined => {
  if (!("config" in loaded) || loaded.config?.files === undefined) {
    return undefined;
  }

  if (Array.isArray(loaded.config.files)) {
    return loaded.config.files;
  }

  return [loaded.config.files];
};

export const resolveCliFiles = async (cli: CliLike, optionsBase: OptionsBase): Promise<string[]> => {
  const loaded = await loadWebfontConfig({ configFile: optionsBase.configFile });
  const configFiles = getFilesFromLoadedConfig(loaded);

  if (cli.input.length > 0 && configFiles !== undefined) {
    throw new Error("Cannot specify input files on the command line when `files` is set in the config file");
  }

  if (cli.input.length > 0) {
    return cli.input;
  }

  if (configFiles !== undefined) {
    return configFiles;
  }

  return [];
};
