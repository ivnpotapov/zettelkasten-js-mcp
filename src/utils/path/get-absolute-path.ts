import path from "node:path";

/**
 * Convert a relative path to an absolute path based on current working directory
 * @param relativePath - The relative path to convert
 * @returns The absolute path
 */
export function getAbsolutePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return path.resolve(process.cwd(), relativePath);
}
