import { readFile } from "node:fs/promises";
import type { WebfontAssistantWasConfig } from "./types";

export const loadWasConfigs = async (configPath: string): Promise<WebfontAssistantWasConfig[]> => {
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as WebfontAssistantWasConfig | WebfontAssistantWasConfig[];

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [parsed];
};
