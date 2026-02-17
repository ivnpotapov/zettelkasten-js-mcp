import fs from "node:fs";
import path from "node:path";

import { getAbsolutePath } from "./get-absolute-path.js";

/**
 * Get the absolute path to the database file
 * Creates the parent directory if it doesn't exist
 * @param databasePath - The database file path (relative or absolute)
 * @returns The absolute path to the database file
 */
export function getDatabasePath(databasePath: string): string {
  const absolutePath = getAbsolutePath(databasePath);
  // Ensure parent directory exists
  const dbDir = path.dirname(absolutePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return absolutePath;
}
