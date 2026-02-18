/**
 * Test utilities for MCP server integration testing
 */

// Types
export type { McpRequest, McpResponse, TestNote } from "./types.js";

// Client communication
export { sendRequest } from "./mcp-client.js";

// Request builders
export { createLink, createNote } from "./requests.js";

// Request ID management
export { getCurrentId, nextId, resetRequestId } from "./request-id.js";
