import { isAbsolute } from "node:path";
import { globby } from "globby";
import { assertPathWithinRoot, getWorkspaceRoot, resolvePathWithinRoot } from "./pathSandbox.js";

const resolveGlobPattern = (pattern: string, workspaceRoot: string): string => {
  const root = getWorkspaceRoot(workspaceRoot);

  if (isAbsolute(pattern)) {
    assertPathWithinRoot(pattern, root);
    return pattern;
  }

  return resolvePathWithinRoot(pattern, root);
};

export const resolveSvgInputPaths = async (patterns: string[], workspaceRoot: string): Promise<string[]> => {
  if (patterns.length === 0) {
    throw new Error("At least one SVG glob pattern is required");
  }

  const root = getWorkspaceRoot(workspaceRoot);
  const resolvedPatterns = patterns.map((pattern) => resolveGlobPattern(pattern, root));
  const matches = await globby(resolvedPatterns, {
    absolute: true,
    onlyFiles: true,
  });

  if (matches.length === 0) {
    throw new Error(`No SVG files matched patterns: ${patterns.join(", ")}`);
  }

  for (const match of matches) {
    assertPathWithinRoot(match, root);
  }

  return matches.sort();
};
