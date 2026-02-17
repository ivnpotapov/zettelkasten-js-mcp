import { getDatabasePath } from "./get-database-path.js";

/**
 * Get the database URL for better-sqlite3 (file path)
 * @param databasePath - The database file path (relative or absolute)
 * @returns The absolute path to the database file
 */
export function getDbUrl(databasePath: string): string {
  return getDatabasePath(databasePath);
}
