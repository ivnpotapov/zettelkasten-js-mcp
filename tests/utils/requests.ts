/**
 * MCP request builders for Zettelkasten operations
 */

import type { McpRequest } from "./types.js";
import { nextId } from "./request-id.js";

/**
 * Create a zk_create_note request
 */
export function createNote(
  title: string,
  content: string,
  noteType?: string,
  tags?: string[],
): McpRequest {
  return {
    jsonrpc: "2.0",
    id: nextId(),
    method: "tools/call",
    params: {
      name: "zk_create_note",
      arguments: {
        title,
        content,
        note_type: noteType ?? "permanent",
        tags: tags ? tags.join(",") : undefined,
      },
    },
  };
}

/**
 * Create a zk_create_link request
 */
export function createLink(
  sourceId: string,
  targetId: string,
  linkType: string,
  description: string,
  bidirectional = false,
): McpRequest {
  return {
    jsonrpc: "2.0",
    id: nextId(),
    method: "tools/call",
    params: {
      name: "zk_create_link",
      arguments: {
        source_id: sourceId,
        target_id: targetId,
        link_type: linkType,
        description,
        bidirectional,
      },
    },
  };
}
