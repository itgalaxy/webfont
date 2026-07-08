import { mergeCliDestIntoConfig, writeResultFiles } from "../../node/writeResultFiles";
import { webfont } from "../../standalone";
import type { Result } from "../../types/Result";
import { loadWasConfigs } from "./loadWasConfigs";
import { mapWasConfigToWebfontOptions } from "./mapWasConfigToWebfontOptions";
import { runAssistantWizard } from "./runAssistantWizard";
import { saveWasConfig } from "./saveWasConfig";
import type { WebfontAssistantWasConfig } from "./types";

const runWasConfig = async (was: WebfontAssistantWasConfig): Promise<Result> => {
  const options = mapWasConfigToWebfontOptions(was);
  const result = await webfont(options);
  mergeCliDestIntoConfig(result, { dest: options.dest });
  await writeResultFiles(result);
  await saveWasConfig(was);
  return result;
};

export type RunAssistantOptions = {
  configPath?: string;
};

export const runAssistant = async (options: RunAssistantOptions = {}): Promise<Result> => {
  if (options.configPath) {
    const configs = await loadWasConfigs(options.configPath);
    let lastResult: Result | undefined;

    for (const was of configs) {
      // biome-ignore lint/performance/noAwaitInLoops: assistant batch configs run sequentially like webfont-assistant --config
      lastResult = await runWasConfig(was);
    }

    if (!lastResult) {
      throw new Error(`No assistant configs found in ${options.configPath}`);
    }

    return lastResult;
  }

  const was = await runAssistantWizard();
  return runWasConfig(was);
};
