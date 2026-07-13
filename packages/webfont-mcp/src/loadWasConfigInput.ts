import {
  guardLoadedWasConfigs,
  loadWasConfigs,
  parseWasConfigJson,
  type WebfontAssistantWasConfig,
} from "webfont";
import { getWorkspaceRoot, resolvePathWithinRoot } from "./pathSandbox.js";

export type WasConfigInput = {
  wasConfigJson?: string;
  wasConfigPath?: string;
  workspaceRoot?: string;
};

export type LoadedWasConfigs = {
  configLabel: string;
  configs: WebfontAssistantWasConfig[];
};

export const sandboxWasConfigPaths = (
  was: WebfontAssistantWasConfig,
  workspaceRoot: string,
): WebfontAssistantWasConfig => ({
  ...was,
  dest: resolvePathWithinRoot(was.dest, workspaceRoot),
  files: resolvePathWithinRoot(was.files, workspaceRoot),
});

const assertNonEmptyStringField = (
  value: string | undefined,
  field: "wasConfigPath" | "wasConfigJson",
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }

  return value;
};

export const loadWasConfigsFromInput = async (input: WasConfigInput): Promise<LoadedWasConfigs> => {
  // Presence (`!== undefined`) is not the same as truthiness — empty strings are "provided"
  // for exclusivity, then rejected with a clear field error below.
  const hasPath = input.wasConfigPath !== undefined;
  const hasJson = input.wasConfigJson !== undefined;

  if (hasPath === hasJson) {
    throw new Error("Provide exactly one of wasConfigPath or wasConfigJson");
  }

  const workspaceRoot = getWorkspaceRoot(input.workspaceRoot);

  if (hasPath) {
    const wasConfigPath = assertNonEmptyStringField(input.wasConfigPath, "wasConfigPath");
    const configPath = resolvePathWithinRoot(wasConfigPath, workspaceRoot);
    const configs = await loadWasConfigs(configPath);
    return {
      configLabel: configPath,
      configs: configs.map((config) => sandboxWasConfigPaths(config, workspaceRoot)),
    };
  }

  const wasConfigJson = assertNonEmptyStringField(input.wasConfigJson, "wasConfigJson");
  const configLabel = "<inline>";
  const parsed = parseWasConfigJson(wasConfigJson, configLabel);
  const configs = guardLoadedWasConfigs(parsed, configLabel);

  return {
    configLabel,
    configs: configs.map((config) => sandboxWasConfigPaths(config, workspaceRoot)),
  };
};
