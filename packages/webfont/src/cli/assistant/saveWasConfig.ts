import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanWasConfigBasename } from "../../was/cleanWasConfigBasename";
import type { WebfontAssistantWasConfig } from "../../was/types";

export const saveWasConfig = async (config: WebfontAssistantWasConfig): Promise<string> => {
  const cleanName = cleanWasConfigBasename(config.name);
  const configPath = join(config.dest, `${cleanName}.was`);
  const payload: WebfontAssistantWasConfig = { ...config, name: cleanName };

  await writeFile(configPath, JSON.stringify(payload), "utf8");
  return configPath;
};
