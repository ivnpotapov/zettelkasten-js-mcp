/**
 * Type definitions for MCP client communication
 */

/**
 * MCP request message format
 */
export interface McpRequest {
  jsonrpc: string;
  id: number;
  method?: string;
  params?: unknown;
}

/**
 * MCP response message format
 */
export interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: {
    serverInfo?: { name: string; version: string };
    content?: Array<{ type: string; text: string }>;
    tools?: Array<{ name: string }>;
  };
  error?: unknown;
}

/**
 * Test note data structure
 */
export interface TestNote {
  title: string;
  content: string;
  tags: string[];
}
