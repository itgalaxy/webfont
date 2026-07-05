import { normalizeTemplateOption, type TemplateOption } from "../lib/parseTemplateOption";

export const parseTemplateFlag = (value: string | undefined): TemplateOption | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error("template must not be empty");
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('template must be a JSON array (e.g. ["html","scss"]) or a template name');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('template must be a JSON array (e.g. ["html","scss"]) or a template name');
    }

    return normalizeTemplateOption(parsed);
  }

  if (trimmed.includes(",")) {
    return normalizeTemplateOption(
      trimmed
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0),
    );
  }

  return trimmed;
};
