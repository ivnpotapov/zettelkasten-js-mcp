#!/usr/bin/env node

/**
 * Main entry point for the Zettelkasten MCP server
 */

import { config } from "./config/index.js";
import { ZettelkastenMcpServer } from "./server/mcp-server.js";
import { createLogger } from "./utils/logger.js";
import { getDatabasePath } from "./utils/path/get-database-path.js";
import { getNotesDir } from "./utils/path/get-notes-dir.js";

const logger = createLogger("Main", config.logLevel);

/**
 * Main function
 */
async function main(): Promise<void> {
  logger.info(`Using SQLite database: ${getDatabasePath(config.databasePath)}`);

  // Ensure directories exist
  try {
    getNotesDir(config.notesDir);

    getDatabasePath(config.databasePath);
  } catch (e) {
    logger.error("Failed to create directories", e as Error);

    process.exit(1);
  }

  try {
    logger.info("Starting Zettelkasten MCP server");

    const server = new ZettelkastenMcpServer();

    await server.run();
  } catch (e) {
    logger.error("Error running server", e as Error);

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);

  process.exit(1);
});
