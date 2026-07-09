import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanWasConfigBasename } from "./cleanWasConfigBasename";
import type { WebfontAssistantWasConfig } from "./types";

export const saveWasConfig = async (config: WebfontAssistantWasConfig): Promise<string> => {
  const cleanName = cleanWasConfigBasename(config.name);
  const configPath = join(config.dest, `${cleanName}.was`);
  const payload: WebfontAssistantWasConfig = { ...config, name: cleanName };

  await writeFile(configPath, JSON.stringify(payload), "utf8");
  return configPath;
};
