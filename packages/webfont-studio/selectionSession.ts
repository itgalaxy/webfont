import type { GlyphMappingRow } from "./glyphMapping";
import { buildDefaultGlyphMappings } from "./glyphMapping";

const SESSION_KEY = "webfont.demo.selection";

export type StoredSvgFile = {
  /** File name as exposed by the browser File API (used as srcPath in the demo). */
  name: string;
  lastModified: number;
  /** SVG source text — required to rebuild File objects after a reload. */
  contents: string;
};

type DemoSelectionSession = {
  version: 1;
  files: StoredSvgFile[];
  glyphMappings: GlyphMappingRow[];
};

const isStoredSvgFile = (value: unknown): value is StoredSvgFile => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<StoredSvgFile>;

  return (
    typeof entry.name === "string" && typeof entry.lastModified === "number" && typeof entry.contents === "string"
  );
};

const isGlyphMappingRow = (value: unknown): value is GlyphMappingRow => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<GlyphMappingRow>;

  return typeof row.srcPath === "string" && typeof row.name === "string" && typeof row.unicodeHex === "string";
};

const parseSession = (raw: string): DemoSelectionSession | undefined => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const session = parsed as Partial<DemoSelectionSession>;

  if (session.version !== 1 || !Array.isArray(session.files)) {
    return undefined;
  }

  const files = session.files.filter(isStoredSvgFile);

  if (files.length === 0) {
    return undefined;
  }

  const glyphMappings = Array.isArray(session.glyphMappings)
    ? session.glyphMappings.filter(isGlyphMappingRow)
    : [];

  return { version: 1, files, glyphMappings };
};

export const storedSvgFilesToFileList = (entries: readonly StoredSvgFile[]): File[] =>
  entries.map(
    (entry) =>
      new File([entry.contents], entry.name, {
        type: "image/svg+xml",
        lastModified: entry.lastModified,
      }),
  );

export const glyphMappingsForRestore = (
  srcPaths: readonly string[],
  stored?: readonly GlyphMappingRow[],
): GlyphMappingRow[] => {
  if (!stored?.length || stored.length !== srcPaths.length) {
    return buildDefaultGlyphMappings(srcPaths);
  }

  const pathSet = new Set(srcPaths);

  if (!stored.every((row) => pathSet.has(row.srcPath))) {
    return buildDefaultGlyphMappings(srcPaths);
  }

  return stored.map((row) => ({ ...row }));
};

export const readSelectionSession = (): DemoSelectionSession | undefined => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return undefined;
    }

    return parseSession(raw);
  } catch {
    return undefined;
  }
};

export const clearSelectionSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage may be unavailable (private mode, blocked storage).
  }
};

export const persistSelectionSession = async (
  files: readonly File[],
  glyphMappings: readonly GlyphMappingRow[],
): Promise<void> => {
  if (files.length === 0) {
    clearSelectionSession();
    return;
  }

  try {
    const storedFiles: StoredSvgFile[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        lastModified: file.lastModified,
        contents: await file.text(),
      })),
    );

    const payload: DemoSelectionSession = {
      version: 1,
      files: storedFiles,
      glyphMappings: glyphMappings.map((row) => ({ ...row })),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage blocked — keep the in-memory selection only.
  }
};
