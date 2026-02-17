import fs from "node:fs";

import { getAbsolutePath } from "./get-absolute-path.js";

/**
 * Get the absolute path to the notes directory
 * Creates the directory if it doesn't exist
 * @param notesDir - The notes directory path (relative or absolute)
 * @returns The absolute path to the notes directory
 */
export function getNotesDir(notesDir: string): string {
  const absolutePath = getAbsolutePath(notesDir);
  // Ensure directory exists
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
}
