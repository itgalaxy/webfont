import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizeWasConfigBasename } from "./sanitizeWasConfigBasename";
import type { WebfontAssistantWasConfig } from "./types";

export const saveWasConfig = async (config: WebfontAssistantWasConfig): Promise<string> => {
  const safeName = sanitizeWasConfigBasename(config.name);
  const configPath = join(config.dest, `${safeName}.was`);
  const payload: WebfontAssistantWasConfig = { ...config, name: safeName };

  await writeFile(configPath, JSON.stringify(payload), "utf8");
  return configPath;
};
