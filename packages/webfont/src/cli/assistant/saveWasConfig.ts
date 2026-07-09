import { writeFile } from "node:fs/promises";
import { resolveWasConfigPath, sanitizeWasConfigBasename } from "./sanitizeWasConfigBasename";
import type { WebfontAssistantWasConfig } from "./types";

export const saveWasConfig = async (config: WebfontAssistantWasConfig): Promise<string> => {
  const safeName = sanitizeWasConfigBasename(config.name);
  const configPath = resolveWasConfigPath(config);
  const payload: WebfontAssistantWasConfig = { ...config, name: safeName };

  await writeFile(configPath, JSON.stringify(payload), "utf8");
  return configPath;
};
