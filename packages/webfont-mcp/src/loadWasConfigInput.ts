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

export const loadWasConfigsFromInput = async (input: WasConfigInput): Promise<LoadedWasConfigs> => {
  const hasPath = input.wasConfigPath !== undefined;
  const hasJson = input.wasConfigJson !== undefined;

  if (hasPath === hasJson) {
    throw new Error("Provide exactly one of wasConfigPath or wasConfigJson");
  }

  const workspaceRoot = getWorkspaceRoot(input.workspaceRoot);

  if (input.wasConfigPath) {
    const configPath = resolvePathWithinRoot(input.wasConfigPath, workspaceRoot);
    const configs = await loadWasConfigs(configPath);
    return {
      configLabel: configPath,
      configs: configs.map((config) => sandboxWasConfigPaths(config, workspaceRoot)),
    };
  }

  const configLabel = "<inline>";
  const parsed = parseWasConfigJson(input.wasConfigJson as string, configLabel);
  const configs = guardLoadedWasConfigs(parsed, configLabel);

  return {
    configLabel,
    configs: configs.map((config) => sandboxWasConfigPaths(config, workspaceRoot)),
  };
};
