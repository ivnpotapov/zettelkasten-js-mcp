/**
 * MCP client communication utilities
 */

import type { McpRequest } from "./types.js";

/**
 * Send a JSON-RPC request to the MCP server
 */
export function sendRequest(server: unknown, request: McpRequest): void {
  const json = JSON.stringify(request);
  (server as { stdin: { write: (data: string) => void } }).stdin.write(
    json + "\n",
  );
}
