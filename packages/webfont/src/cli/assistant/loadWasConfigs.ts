import { readFile } from "node:fs/promises";
import type { WebfontAssistantWasConfig } from "./types";

const isWasConfigObject = (value: unknown): value is WebfontAssistantWasConfig =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertWasConfigObject = (value: unknown, configPath: string, label: string): WebfontAssistantWasConfig => {
  if (!isWasConfigObject(value)) {
    throw new Error(`Invalid .was config ${label} in ${configPath}: expected an object`);
  }

  return value;
};

export const loadWasConfigs = async (configPath: string): Promise<WebfontAssistantWasConfig[]> => {
  let parsed: unknown;

  try {
    const raw = await readFile(configPath, "utf8");
    parsed = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in .was config ${configPath}: ${error.message}`);
    }

    throw error;
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => assertWasConfigObject(item, configPath, `at index ${index}`));
  }

  return [assertWasConfigObject(parsed, configPath, "root value")];
};
