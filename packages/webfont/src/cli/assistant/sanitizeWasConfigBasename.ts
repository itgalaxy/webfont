import { basename, join } from "node:path";
import type { WebfontAssistantWasConfig } from "./types";

export const sanitizeWasConfigBasename = (name: string): string => {
  const safe = basename(name.trim());

  if (safe === "" || safe === "." || safe === "..") {
    throw new Error(`Invalid font name for .was config: "${name}"`);
  }

  return safe;
};

export const resolveWasConfigPath = (config: Pick<WebfontAssistantWasConfig, "dest" | "name">): string => {
  const safeName = sanitizeWasConfigBasename(config.name);
  return join(config.dest, `${safeName}.was`);
};
