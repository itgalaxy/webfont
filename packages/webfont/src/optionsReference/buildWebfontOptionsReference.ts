import { defaultWebfontOptions } from "../standalone/defaultOptions";
import type { WebfontOptions } from "../types/WebfontOptions";
import { API_ONLY_OPTION_DESCRIPTIONS } from "./apiOnlyOptionsCatalog";
import { CLI_FLAG_SECTIONS, type CliFlagCatalogEntry, type CliFlagType } from "./cliFlagCatalog";
import { formatCliFlagDescription } from "./formatCliFlagDescription";

export type WebfontCliFlagReference = {
  default?: boolean | string;
  description: string;
  long: string;
  section?: string;
  short?: string;
  type: CliFlagType;
};

export type WebfontApiOnlyOptionReference = {
  cliEquivalent?: string;
  description: string;
};

export type WebfontOptionsReference = {
  apiOnly: Record<string, WebfontApiOnlyOptionReference>;
  cliFlags: Record<string, WebfontCliFlagReference>;
  defaults: Omit<WebfontOptions, "files">;
};

const catalogEntryToReference = (entry: CliFlagCatalogEntry, sectionTitle?: string): WebfontCliFlagReference => {
  const reference: WebfontCliFlagReference = {
    description: formatCliFlagDescription(entry.description),
    long: entry.long,
    type: entry.type,
  };

  if (entry.short !== undefined) {
    reference.short = entry.short;
  }

  if (entry.default !== undefined) {
    reference.default = entry.default;
  }

  if (sectionTitle !== undefined) {
    reference.section = sectionTitle;
  }

  return reference;
};

export const buildCliFlagReferences = (): Record<string, WebfontCliFlagReference> => {
  const references: Record<string, WebfontCliFlagReference> = {};

  for (const section of CLI_FLAG_SECTIONS) {
    for (const entry of section.entries) {
      references[entry.key] = catalogEntryToReference(entry, section.title);
    }
  }

  return references;
};

/** Defaults, CLI flag metadata, and API-only option summaries for agents and tooling. */
export const buildWebfontOptionsReference = (): WebfontOptionsReference => ({
  apiOnly: { ...API_ONLY_OPTION_DESCRIPTIONS },
  cliFlags: buildCliFlagReferences(),
  defaults: defaultWebfontOptions(),
});
