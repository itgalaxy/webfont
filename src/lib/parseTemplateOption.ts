export type TemplateOption = string | string[];

export const normalizeTemplateOption = (template: unknown): string[] => {
  if (template === undefined || template === null) {
    return [];
  }

  if (typeof template === "string") {
    const trimmed = template.trim();

    if (trimmed.length === 0) {
      throw new Error("template must not be empty");
    }

    return [trimmed];
  }

  if (Array.isArray(template)) {
    if (template.length === 0) {
      throw new Error("template must not be empty");
    }

    if (!template.every((entry) => typeof entry === "string" && entry.trim().length > 0)) {
      throw new Error("template must be a string or an array of non-empty strings");
    }

    return template.map((entry) => entry.trim());
  }

  throw new Error("template must be a string or an array of strings");
};
