/**
 * MCP Server implementation using the new modular architecture
 * Uses application factory and tool handlers
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApplication } from "../../application/factory.js";
import { config } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";
import { registerToolHandlers } from "./tool-handlers/index.js";

const logger = createLogger("MCPServer", config.logLevel);

/**
 * Zettelkasten MCP Server
 */
export class ZettelkastenMcpServer {
  private server: McpServer;
  private app: ReturnType<typeof createApplication>;

  constructor() {
    // Create application with all dependencies wired up
    this.app = createApplication();

    // Create MCP server
    this.server = new McpServer(
      {
        name: config.serverName,
        version: config.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    // Register all tool handlers
    registerToolHandlers(this.server, this.app);

    logger.info("Zettelkasten MCP server initialized with new architecture");
  }

  /**
   * Run the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("Zettelkasten MCP server running");
  }

  /**
   * Shutdown the server and cleanup resources
   */
  shutdown(): void {
    this.app.shutdown();
    logger.info("Zettelkasten MCP server shutdown complete");
  }
}
