/**
 * Request ID management for MCP client
 */

let currentId = 1;

/**
 * Reset the request ID counter (useful for tests)
 */
export function resetRequestId(): void {
  currentId = 1;
}

/**
 * Get current request ID
 */
export function getCurrentId(): number {
  return currentId;
}

/**
 * Increment and return the next request ID
 */
export function nextId(): number {
  return currentId++;
}
