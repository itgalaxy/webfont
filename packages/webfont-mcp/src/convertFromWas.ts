import { mergeCliDestIntoConfig, type WebfontAssistantWasConfig, webfont, writeResultFiles } from "webfont";
import type { WasConfigInput } from "./loadWasConfigInput.js";
import { type SerializedConversionResult, serializeConversionResult } from "./serializeResult.js";
import { validateWasConfig } from "./validateWasConfig.js";

export type ConvertFromWasResult = {
  configLabel: string;
  conversions: SerializedConversionResult[];
};

const convertWasEntry = async (
  entry: Awaited<ReturnType<typeof validateWasConfig>>["entries"][number],
): Promise<SerializedConversionResult> => {
  const result = await webfont(entry.mappedOptions);
  const dest = entry.mappedOptions.dest;

  if (typeof dest !== "string" || dest.trim() === "") {
    throw new Error("Mapped webfont options are missing a non-empty dest");
  }

  mergeCliDestIntoConfig(result, { dest });
  await writeResultFiles(result);
  return serializeConversionResult(result, dest);
};

export const convertFromWas = async (input: WasConfigInput): Promise<ConvertFromWasResult> => {
  const validated = await validateWasConfig(input);
  const conversions = await validated.entries.reduce<Promise<SerializedConversionResult[]>>(
    (chain, entry) => chain.then(async (accumulated) => [...accumulated, await convertWasEntry(entry)]),
    Promise.resolve([]),
  );

  return {
    configLabel: validated.configLabel,
    conversions,
  };
};

export type { WebfontAssistantWasConfig };
