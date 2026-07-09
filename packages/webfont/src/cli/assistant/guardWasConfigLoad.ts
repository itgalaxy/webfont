import type { WebfontAssistantWasConfig } from "./types";

const REQUIRED_WAS_STRING_FIELDS = ["dest", "files", "name", "template"] as const;

const isWasConfigObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertNonEmptyStringField = (
  value: unknown,
  field: (typeof REQUIRED_WAS_STRING_FIELDS)[number],
  configPath: string,
  label: string,
): void => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid .was config ${label} in ${configPath}: "${field}" must be a non-empty string`);
  }
};

const guardWasConfigObject = (value: unknown, configPath: string, label: string): WebfontAssistantWasConfig => {
  if (!isWasConfigObject(value)) {
    throw new Error(`Invalid .was config ${label} in ${configPath}: expected an object`);
  }

  for (const field of REQUIRED_WAS_STRING_FIELDS) {
    assertNonEmptyStringField(value[field], field, configPath, label);
  }

  return value as WebfontAssistantWasConfig;
};

export const parseWasConfigJson = (raw: string, configPath: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in .was config ${configPath}: ${error.message}`);
    }

    throw error;
  }
};

export const guardLoadedWasConfigs = (parsed: unknown, configPath: string): WebfontAssistantWasConfig[] => {
  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => guardWasConfigObject(item, configPath, `at index ${index}`));
  }

  return [guardWasConfigObject(parsed, configPath, "root value")];
};
