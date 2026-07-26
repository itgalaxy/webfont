import { readFile } from "node:fs/promises";
import { guardLoadedWasConfigs, parseWasConfigJson } from "./guardWasConfigLoad";
import type { WebfontAssistantWasConfig } from "./types";

export const loadWasConfigs = async (configPath: string): Promise<WebfontAssistantWasConfig[]> => {
  const raw = await readFile(configPath, "utf8");
  const parsed = parseWasConfigJson(raw, configPath);
  return guardLoadedWasConfigs(parsed, configPath);
};
