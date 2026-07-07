import type { AnyFlags } from "meow";
import {
  CLI_FLAG_SECTIONS,
  CLI_INPUT_SECTION,
  CLI_USAGE_LINE,
  type CliFlagCatalogEntry,
  type CliFlagSection,
} from "./cliFlagCatalog";

const HELP_INDENT = "    ";
const FLAG_INDENT = "        ";
const DESCRIPTION_INDENT = "            ";

const formatDescription = (description: string | readonly string[]): string => {
  let lines: readonly string[];

  if (typeof description === "string") {
    lines = [description];
  } else {
    lines = description;
  }

  return lines.map((line) => `${DESCRIPTION_INDENT}${line}`).join("\n");
};

const formatFlagLine = (entry: CliFlagCatalogEntry): string => {
  const long = entry.long;

  if (entry.short) {
    return `${FLAG_INDENT}-${entry.short}, ${long}`;
  }

  return `${FLAG_INDENT}${long}`;
};

const indentInputLine = (line: string): string => {
  if (line === "") {
    return "";
  }

  return `${FLAG_INDENT}${line}`;
};

const renderInputSection = (): string => {
  const body = CLI_INPUT_SECTION.lines.map(indentInputLine).join("\n");

  return `${CLI_INPUT_SECTION.title}\n\n${body}`;
};

const renderFlagEntry = (entry: CliFlagCatalogEntry): string =>
  [formatFlagLine(entry), "", formatDescription(entry.description)].join("\n");

const renderFlagSection = (section: CliFlagSection): string => {
  const blocks = section.entries.map(renderFlagEntry);

  if (section.title) {
    return [section.title, ...blocks].join("\n\n");
  }

  return blocks.join("\n\n");
};

const renderCliHelpText = (): string => {
  const parts = [CLI_USAGE_LINE, renderInputSection(), ...CLI_FLAG_SECTIONS.map(renderFlagSection)];

  return `\n${HELP_INDENT}${parts.join(`\n\n${HELP_INDENT}`)}\n`;
};

const buildMeowFlag = (entry: CliFlagCatalogEntry): AnyFlags[string] => {
  if (entry.type === "boolean") {
    if (entry.short && typeof entry.default === "boolean") {
      return { type: "boolean", shortFlag: entry.short, default: entry.default };
    }

    if (entry.short) {
      return { type: "boolean", shortFlag: entry.short };
    }

    if (typeof entry.default === "boolean") {
      return { type: "boolean", default: entry.default };
    }

    return { type: "boolean" };
  }

  if (entry.short && typeof entry.default === "string") {
    return { type: "string", shortFlag: entry.short, default: entry.default };
  }

  if (entry.short) {
    return { type: "string", shortFlag: entry.short };
  }

  if (typeof entry.default === "string") {
    return { type: "string", default: entry.default };
  }

  return { type: "string" };
};

const buildWebfontMeowFlags = (): AnyFlags => {
  const flags: AnyFlags = {};

  for (const section of CLI_FLAG_SECTIONS) {
    for (const entry of section.entries) {
      flags[entry.key] = buildMeowFlag(entry);
    }
  }

  flags.dest = {
    shortFlag: "d",
    default: process.cwd(),
    type: "string",
  };

  return flags;
};

/** Markers asserted in help-text contract tests (usage line + notable documented flags). */
export const WEBFONT_CLI_HELP_MARKERS = [
  CLI_USAGE_LINE,
  "--config",
  "--assistant",
  "--assistant-config",
  "--fontName",
  "--formats",
  "--dest-create",
  "--no-sort",
  "--ligatures",
  "--unicode-range",
  "--no-template-font-ligatures",
  "--addHashInFontUrl",
  "--optimize-svg",
  "svg-diagnose",
] as const;

const CLI_DOCS_HEADER = `# Command Line Interface

The interface for command-line usage is fairly simplistic at this stage, as seen in the usage section below.

Install the package and wire the CLI script first: [Install guide](https://webfont.js.org/introduction/install) ([source](../install.md)).

## Usage

`;

const CLI_DOCS_FOOTER = `

## Exit codes

The CLI can exit the process with the following exit codes:

- **0** — All ok.
- **1** — Something unknown went wrong.
- **Other** — Related to using packages.
`;

const GENERATED_NOTICE = `<!-- cli-docs:generated -->
> **Maintainers:** CLI help is generated from \`packages/webfont/src/optionsReference/cliFlagCatalog.ts\`. After editing flag metadata, run \`npm run docs:cli\` at the repo root (unit tests also guard drift).
`;

export const renderCliMarkdownDoc = (): string =>
  `${CLI_DOCS_HEADER}${GENERATED_NOTICE}\n\`\`\`shell${renderCliHelpText()}\`\`\`${CLI_DOCS_FOOTER}`;

export const webfontCliHelpText = renderCliHelpText();
export const webfontMeowFlags = buildWebfontMeowFlags();
