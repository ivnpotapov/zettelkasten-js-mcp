/**
 * Configuration module for the Zettelkasten MCP server
 * Initializes and exports the fully configured config object
 */

import { config as dotenvConfig } from "dotenv";
import { ZettelkastenConfig } from "./config-class.js";

// Load .env file
dotenvConfig();

export const config = new ZettelkastenConfig();

export type { ZettelkastenConfig } from "./config-class.js";
