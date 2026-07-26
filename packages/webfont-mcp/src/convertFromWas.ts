import { mergeCliDestIntoConfig, type WebfontAssistantWasConfig, webfont, writeResultFiles } from "webfont";
import type { WasConfigInput } from "./loadWasConfigInput.js";
import { getWorkspaceRoot } from "./pathSandbox.js";
import { resolveSvgInputPaths } from "./resolveSvgInputs.js";
import { type SerializedConversionResult, serializeConversionResult } from "./serializeResult.js";
import { validateWasConfig } from "./validateWasConfig.js";

export type ConvertFromWasResult = {
  configLabel: string;
  conversions: SerializedConversionResult[];
};

const filesPatternsFromMappedOptions = (files: unknown): string[] => {
  if (typeof files === "string" && files.trim() !== "") {
    return [files];
  }

  if (Array.isArray(files) && files.length > 0 && files.every((entry) => typeof entry === "string")) {
    return files;
  }

  throw new Error('Mapped webfont options are missing a non-empty "files" glob or path list');
};

const convertWasEntry = async (
  entry: Awaited<ReturnType<typeof validateWasConfig>>["entries"][number],
  workspaceRoot: string,
): Promise<SerializedConversionResult> => {
  // Same per-match sandbox as convert_svgs_to_font — do not let webfont() resolve globs alone.
  const files = await resolveSvgInputPaths(
    filesPatternsFromMappedOptions(entry.mappedOptions.files),
    workspaceRoot,
  );
  const result = await webfont({
    ...entry.mappedOptions,
    files,
  });
  const dest = entry.mappedOptions.dest;

  if (typeof dest !== "string" || dest.trim() === "") {
    throw new Error("Mapped webfont options are missing a non-empty dest");
  }

  mergeCliDestIntoConfig(result, { dest });
  await writeResultFiles(result);
  return serializeConversionResult(result, dest);
};

export const convertFromWas = async (input: WasConfigInput): Promise<ConvertFromWasResult> => {
  const workspaceRoot = getWorkspaceRoot(input.workspaceRoot);
  const validated = await validateWasConfig(input);
  const conversions = await validated.entries.reduce<Promise<SerializedConversionResult[]>>(
    (chain, entry) =>
      chain.then(async (accumulated) => [...accumulated, await convertWasEntry(entry, workspaceRoot)]),
    Promise.resolve([]),
  );

  return {
    configLabel: validated.configLabel,
    conversions,
  };
};

export type { WebfontAssistantWasConfig };
