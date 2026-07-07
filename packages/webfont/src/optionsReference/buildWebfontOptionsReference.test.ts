import { defaultWebfontOptions } from "../standalone/defaultOptions";
import { buildCliFlagReferences, buildWebfontOptionsReference } from "./buildWebfontOptionsReference";
import { CLI_FLAG_SECTIONS } from "./cliFlagCatalog";
import { formatCliFlagDescription } from "./formatCliFlagDescription";

describe("buildWebfontOptionsReference", () => {
  it("should expose runtime defaults from defaultWebfontOptions", () => {
    const reference = buildWebfontOptionsReference();

    expect(reference.defaults).toEqual(defaultWebfontOptions());
  });

  it("should expose CLI flag descriptions from cliFlagCatalog", () => {
    const references = buildCliFlagReferences();
    const fontNameEntry = CLI_FLAG_SECTIONS.flatMap((section) => section.entries).find(
      (entry) => entry.key === "fontName",
    );

    expect(fontNameEntry).toBeDefined();
    expect(references.fontName.description).toBe(formatCliFlagDescription(fontNameEntry?.description ?? ""));
    expect(references.fontName.long).toBe("--fontName");
  });

  it("should include API-only options absent from the CLI catalog", () => {
    const reference = buildWebfontOptionsReference();

    expect(reference.apiOnly.files.description).toMatch(/fast-glob/u);
    expect(reference.apiOnly.svgTools.cliEquivalent).toBe("svgDiagnose");
    expect(reference.cliFlags.svgDiagnose).toBeDefined();
  });
});
