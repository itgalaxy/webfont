import { mapWasConfigToWebfontOptions, type WebfontAssistantWasConfig } from "webfont";
import { loadWasConfigsFromInput, type WasConfigInput } from "./loadWasConfigInput.js";

export type ValidateWasConfigResult = {
  configLabel: string;
  entries: Array<{
    mappedOptions: ReturnType<typeof mapWasConfigToWebfontOptions>;
    was: WebfontAssistantWasConfig;
  }>;
};

export const validateWasConfig = async (input: WasConfigInput): Promise<ValidateWasConfigResult> => {
  const loaded = await loadWasConfigsFromInput(input);

  return {
    configLabel: loaded.configLabel,
    entries: loaded.configs.map((was) => ({
      mappedOptions: mapWasConfigToWebfontOptions(was),
      was,
    })),
  };
};
