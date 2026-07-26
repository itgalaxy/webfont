import { resolvePathWithinRoot } from "./pathSandbox.js";

/**
 * Built-in webfont template ids (see packages/webfont/templates and CLI --template help).
 * These are not filesystem paths — leave them unchanged for webfont().
 */
export const BUILT_IN_TEMPLATE_NAMES = new Set(["css", "html", "json", "scss", "styl"]);

export const isBuiltInTemplateName = (template: string): boolean => BUILT_IN_TEMPLATE_NAMES.has(template.trim());

/**
 * Leave built-in template names as-is; resolve custom template paths inside workspaceRoot.
 */
export const resolveTemplateWithinRoot = (template: string, workspaceRoot: string): string => {
  const trimmed = template.trim();

  if (trimmed === "") {
    throw new Error("template must be a non-empty string");
  }

  if (isBuiltInTemplateName(trimmed)) {
    return trimmed;
  }

  return resolvePathWithinRoot(trimmed, workspaceRoot);
};
