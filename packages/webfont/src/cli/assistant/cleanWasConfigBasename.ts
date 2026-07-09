import { basename, join } from "node:path";
import type { WebfontAssistantWasConfig } from "./types";

export const cleanWasConfigBasename = (name: string): string => {
  const cleaned = basename(name.trim());

  if (cleaned === "" || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid font name for .was config: "${name}"`);
  }

  return cleaned;
};

export const resolveWasConfigPath = (config: Pick<WebfontAssistantWasConfig, "dest" | "name">): string => {
  const cleanName = cleanWasConfigBasename(config.name);
  return join(config.dest, `${cleanName}.was`);
};
