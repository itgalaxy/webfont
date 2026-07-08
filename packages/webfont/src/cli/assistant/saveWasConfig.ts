import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { WebfontAssistantWasConfig } from "./types";

export const saveWasConfig = async (config: WebfontAssistantWasConfig): Promise<string> => {
  const configPath = join(config.dest, `${config.name}.was`);
  await writeFile(configPath, JSON.stringify(config), "utf8");
  return configPath;
};
