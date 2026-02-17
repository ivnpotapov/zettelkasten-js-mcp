import { config as dotenvConfig } from "dotenv";
import packageJson from "../../package.json" with { type: "json" };

dotenvConfig();

/**
 * Plain configuration object for the Zettelkasten MCP server
 */
export const config = {
  // Storage configuration
  notesDir: process.env.ZETTELKASTEN_NOTES_DIR || "data/notes",

  // Database configuration
  databasePath:
    process.env.ZETTELKASTEN_DATABASE_PATH || "data/db/zettelkasten.db",

  // Server configuration (from package.json)
  serverName: packageJson.name,
  serverVersion: packageJson.version,

  // Date format for ID generation (using ISO format for timestamps)
  idDateFormat: "%Y%m%dT%H%M%S",

  // Logging configuration
  logLevel: process.env.ZETTELKASTEN_LOG_LEVEL || "INFO",
} as const;
