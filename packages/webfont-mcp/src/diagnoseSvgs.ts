import { readFile } from "node:fs/promises";
import { diagnoseSvgContents, type SvgGlyphDiagnostic } from "webfont";
import { getWorkspaceRoot } from "./pathSandbox.js";
import { resolveSvgInputPaths } from "./resolveSvgInputs.js";

export type DiagnoseSvgsInput = {
  files: string[];
  workspaceRoot?: string;
};

export type DiagnoseSvgsResult = {
  diagnostics: SvgGlyphDiagnostic[];
  fileCount: number;
  filesWithIssues: number;
};

export const diagnoseSvgs = async (input: DiagnoseSvgsInput): Promise<DiagnoseSvgsResult> => {
  const workspaceRoot = getWorkspaceRoot(input.workspaceRoot);
  const files = await resolveSvgInputPaths(input.files, workspaceRoot);

  const perFileDiagnostics = await Promise.all(
    files.map(async (filePath) => {
      const contents = await readFile(filePath, "utf8");
      return diagnoseSvgContents(filePath, contents);
    }),
  );
  const diagnostics = perFileDiagnostics.flat();

  const filesWithIssues = new Set(diagnostics.map((entry) => entry.srcPath)).size;

  return {
    diagnostics,
    fileCount: files.length,
    filesWithIssues,
  };
};
