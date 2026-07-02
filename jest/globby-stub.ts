import fg from "fast-glob";

export function globby(patterns: string | readonly string[]): Promise<string[]> {
  return fg([].concat(patterns as string | string[]));
}
