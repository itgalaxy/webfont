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

const runWasConfigsSequentially = (
  configs: readonly WebfontAssistantWasConfig[],
  emptyError: string,
): Promise<Result> => {
  const [head, ...tail] = configs;

  if (!head) {
    return Promise.reject(new Error(emptyError));
  }

  return tail.reduce<Promise<Result>>((chain, was) => chain.then(() => runWasConfig(was)), runWasConfig(head));
};

export type RunAssistantOptions = {
  configPath?: string;
};

export const runAssistant = async (options: RunAssistantOptions = {}): Promise<Result> => {
  if (options.configPath) {
    const configs = await loadWasConfigs(options.configPath);
    return runWasConfigsSequentially(configs, `No assistant configs found in ${options.configPath}`);
  }

  const was = await runAssistantWizard();
  return runWasConfig(was);
};
