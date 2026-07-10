import { basename, join } from "node:path";
import type { WebfontAssistantWasConfig } from "./types";

export const cleanWasConfigBasename = (name: unknown, field = "name"): string => {
  if (typeof name !== "string") {
    throw new TypeError(`Invalid .was config: "${field}" must be a string`);
  }

  const cleaned = basename(name.trim());

  if (cleaned === "" || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid font name for .was config: "${name}"`);
  }

  return cleaned;
};

export const cleanOptionalWasBasename = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new TypeError(`Invalid .was config: "${field}" must be a string`);
  }

  if (value.trim() === "") {
    return undefined;
  }

  return cleanWasConfigBasename(value, field);
};

export const resolveWasConfigPath = (config: Pick<WebfontAssistantWasConfig, "dest" | "name">): string => {
  const cleanName = cleanWasConfigBasename(config.name, "name");
  return join(config.dest, `${cleanName}.was`);
};
