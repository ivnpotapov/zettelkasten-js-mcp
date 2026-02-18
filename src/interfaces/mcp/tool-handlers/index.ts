/**
 * MCP tool handlers - one handler per tool
 * Each handler implements an MCP tool using the application use cases
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { Application } from "../../../application/factory.js";

/**
 * Register all tool handlers with the MCP server
 */
export function registerToolHandlers(
  server: McpServer,
  app: Application,
): void {
  registerCreateNote(server, app);
  registerGetNote(server, app);
  registerUpdateNote(server, app);
  registerDeleteNote(server, app);
  registerCreateLink(server, app);
  registerRemoveLink(server, app);
  registerSearchNotes(server, app);
  registerGetLinkedNotes(server, app);
  registerGetAllTags(server, app);
  registerFindSimilarNotes(server, app);
  registerFindCentralNotes(server, app);
  registerFindOrphanedNotes(server, app);
  registerListNotesByDate(server, app);
  registerRebuildIndex(server, app);
}

/**
 * Format error response consistently
 */
function formatErrorResponse(error: Error): string {
  if (
    error.message.includes("not found") ||
    error.message.includes("does not exist")
  ) {
    return `Error: ${error.message}`;
  } else if (
    error.message.includes("required") ||
    error.message.includes("Invalid")
  ) {
    return `Error: ${error.message}`;
  } else {
    return `Error: ${error.message}`;
  }
}

/**
 * zk_create_note tool handler
 */
function registerCreateNote(server: McpServer, app: Application): void {
  server.tool(
    "zk_create_note",
    "Create a new Zettelkasten note.",
    {
      title: z.string().describe("The title of the note"),
      content: z.string().describe("The main content of the note"),
      note_type: z
        .enum(["fleeting", "literature", "permanent", "structure", "hub"])
        .optional()
        .default("permanent")
        .describe("Type of note"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated list of tags (optional)"),
    },
    async (args) => {
      try {
        const tagList = args.tags
          ? args.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          : [];

        const note = app.createNote.execute({
          title: args.title,
          content: args.content,
          noteType: args.note_type,
          tags: tagList,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Note created successfully with ID: ${note.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_get_note tool handler
 */
function registerGetNote(server: McpServer, app: Application): void {
  server.tool(
    "zk_get_note",
    "Retrieve a note by ID or title.",
    {
      identifier: z.string().describe("The ID or title of the note"),
    },
    async (args) => {
      try {
        const note = app.getNote.byIdOrTitle(args.identifier);
        if (!note) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Note not found: ${args.identifier}`,
              },
            ],
          };
        }

        const { formatNoteForDisplay } = await import(
          "../../../utils/markdown.js"
        );
        return {
          content: [
            {
              type: "text" as const,
              text: formatNoteForDisplay(note),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_update_note tool handler
 */
function registerUpdateNote(server: McpServer, app: Application): void {
  server.tool(
    "zk_update_note",
    "Update an existing note.",
    {
      note_id: z.string().describe("The ID of the note to update"),
      title: z.string().optional().describe("New title (optional)"),
      content: z.string().optional().describe("New content (optional)"),
      note_type: z
        .enum(["fleeting", "literature", "permanent", "structure", "hub"])
        .optional()
        .describe("New note type (optional)"),
      tags: z
        .string()
        .optional()
        .describe("New comma-separated list of tags (optional)"),
    },
    async (args) => {
      try {
        const tagList = args.tags
          ? args.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          : undefined;

        const note = app.updateNote.execute({
          noteId: args.note_id,
          title: args.title,
          content: args.content,
          noteType: args.note_type,
          tags: tagList,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Note updated successfully: ${note.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_delete_note tool handler
 */
function registerDeleteNote(server: McpServer, app: Application): void {
  server.tool(
    "zk_delete_note",
    "Delete a note.",
    {
      note_id: z.string().describe("The ID of the note to delete"),
    },
    async (args) => {
      try {
        app.deleteNote.execute(args.note_id);
        return {
          content: [
            {
              type: "text" as const,
              text: `Note deleted successfully: ${args.note_id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_create_link tool handler
 */
function registerCreateLink(server: McpServer, app: Application): void {
  server.tool(
    "zk_create_link",
    "Create a link between two notes.",
    {
      source_id: z.string().describe("ID of the source note"),
      target_id: z.string().describe("ID of the target note"),
      link_type: z
        .enum([
          "reference",
          "extends",
          "refines",
          "contradicts",
          "questions",
          "supports",
          "related",
        ])
        .optional()
        .default("reference")
        .describe("Type of link"),
      description: z
        .string()
        .optional()
        .describe("Optional description of the link"),
      bidirectional: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to create a link in both directions"),
    },
    async (args) => {
      try {
        app.createLink.execute({
          sourceId: args.source_id,
          targetId: args.target_id,
          linkType: args.link_type,
          description: args.description,
          bidirectional: args.bidirectional ?? false,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: args.bidirectional
                ? `Bidirectional link created between ${args.source_id} and ${args.target_id}`
                : `Link created from ${args.source_id} to ${args.target_id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_remove_link tool handler
 */
function registerRemoveLink(server: McpServer, app: Application): void {
  server.tool(
    "zk_remove_link",
    "Remove a link between two notes.",
    {
      source_id: z.string().describe("ID of the source note"),
      target_id: z.string().describe("ID of the target note"),
      bidirectional: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to remove the link in both directions"),
    },
    async (args) => {
      try {
        app.removeLink.execute(
          args.source_id,
          args.target_id,
          args.bidirectional ?? false,
        );

        return {
          content: [
            {
              type: "text" as const,
              text: args.bidirectional
                ? `Bidirectional link removed between ${args.source_id} and ${args.target_id}`
                : `Link removed from ${args.source_id} to ${args.target_id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_search_notes tool handler
 */
function registerSearchNotes(server: McpServer, app: Application): void {
  server.tool(
    "zk_search_notes",
    "Search for notes by text, tags, or type.",
    {
      query: z
        .string()
        .optional()
        .describe("Text to search for in titles and content"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated list of tags to filter by"),
      note_type: z
        .enum(["fleeting", "literature", "permanent", "structure", "hub"])
        .optional()
        .describe("Type of note to filter by"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of results to return"),
    },
    async (args) => {
      try {
        const tagList = args.tags
          ? args.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          : undefined;

        const results = app.searchNotes.search({
          query: args.query,
          tags: tagList,
          noteType: args.note_type,
          limit: args.limit,
        });

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No matching notes found.",
              },
            ],
          };
        }

        let output = `Found ${results.length} matching notes:\n\n`;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const note = result.note;
          output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
          if (note.tags.length > 0) {
            output += `   Tags: ${note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          output += `   Created: ${note.createdAt.toISOString().split("T")[0]}\n`;
          const contentPreview = note.content.slice(0, 150).replace(/\n/g, " ");
          output += `   Preview: ${contentPreview}${note.content.length > 150 ? "..." : ""}\n\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_get_linked_notes tool handler
 */
function registerGetLinkedNotes(server: McpServer, app: Application): void {
  server.tool(
    "zk_get_linked_notes",
    "Get notes linked to/from a note.",
    {
      note_id: z.string().describe("ID of the note"),
      direction: z
        .enum(["outgoing", "incoming", "both"])
        .optional()
        .default("both")
        .describe("Direction of links"),
    },
    async (args) => {
      try {
        const linkedNotes = app.getLinkedNotes.execute(
          args.note_id,
          args.direction ?? "both",
        );

        if (linkedNotes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No ${args.direction ?? "both"} links found for note ${args.note_id}.`,
              },
            ],
          };
        }

        let output = `Found ${linkedNotes.length} ${args.direction ?? "both"} linked notes for ${args.note_id}:\n\n`;
        for (let i = 0; i < linkedNotes.length; i++) {
          const note = linkedNotes[i];
          output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
          if (note.tags.length > 0) {
            output += `   Tags: ${note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          output += "\n";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_get_all_tags tool handler
 */
function registerGetAllTags(server: McpServer, app: Application): void {
  server.tool(
    "zk_get_all_tags",
    "Get all tags in the Zettelkasten.",
    {},
    async () => {
      try {
        const notes = app.getNote.all();
        const allTags = new Set<string>();
        for (const note of notes) {
          for (const tag of note.tags) {
            allTags.add(tag.name);
          }
        }

        if (allTags.size === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No tags found in the Zettelkasten.",
              },
            ],
          };
        }

        const sortedTags = Array.from(allTags).sort((a: string, b: string) =>
          a.toLowerCase().localeCompare(b.toLowerCase()),
        );

        let output = `Found ${sortedTags.length} tags:\n\n`;
        for (let i = 0; i < sortedTags.length; i++) {
          output += `${i + 1}. ${sortedTags[i]}\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_find_similar_notes tool handler
 */
function registerFindSimilarNotes(server: McpServer, app: Application): void {
  server.tool(
    "zk_find_similar_notes",
    "Find notes similar to a given note.",
    {
      note_id: z.string().describe("ID of the reference note"),
      threshold: z
        .number()
        .optional()
        .default(0.3)
        .describe("Similarity threshold (0.0-1.0)"),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return"),
    },
    async (args) => {
      try {
        const threshold = args.threshold ?? 0.3;
        const limit = args.limit ?? 5;

        const similarNotes = app.findSimilarNotes.execute(
          args.note_id,
          threshold,
        );
        const limitedNotes = similarNotes.slice(0, limit);

        if (limitedNotes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No similar notes found for ${args.note_id} with threshold ${threshold}.`,
              },
            ],
          };
        }

        let output = `Found ${limitedNotes.length} similar notes for ${args.note_id}:\n\n`;
        for (let i = 0; i < limitedNotes.length; i++) {
          const result = limitedNotes[i];
          output += `${i + 1}. ${result.note.title} (ID: ${result.note.id})\n`;
          output += `   Similarity: ${result.score.toFixed(2)}\n`;
          if (result.note.tags.length > 0) {
            output += `   Tags: ${result.note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          const contentPreview = result.note.content
            .slice(0, 100)
            .replace(/\n/g, " ");
          output += `   Preview: ${contentPreview}${result.note.content.length > 100 ? "..." : ""}\n\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_find_central_notes tool handler
 */
function registerFindCentralNotes(server: McpServer, app: Application): void {
  server.tool(
    "zk_find_central_notes",
    "Find notes with the most connections (incoming + outgoing links). Notes are ranked by their total number of connections, determining their centrality in the knowledge network.",
    {
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of results to return"),
    },
    async (args) => {
      try {
        const limit = args.limit ?? 10;
        const centralNotes = app.findCentralNotes.execute(limit);

        if (centralNotes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No notes found with connections.",
              },
            ],
          };
        }

        let output = "Central notes in the Zettelkasten (most connected):\n\n";
        for (let i = 0; i < centralNotes.length; i++) {
          const result = centralNotes[i];
          output += `${i + 1}. ${result.note.title} (ID: ${result.note.id})\n`;
          output += `   Connections: ${result.connections}\n`;
          if (result.note.tags.length > 0) {
            output += `   Tags: ${result.note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          const contentPreview = result.note.content
            .slice(0, 100)
            .replace(/\n/g, " ");
          output += `   Preview: ${contentPreview}${result.note.content.length > 100 ? "..." : ""}\n\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_find_orphaned_notes tool handler
 */
function registerFindOrphanedNotes(server: McpServer, app: Application): void {
  server.tool(
    "zk_find_orphaned_notes",
    "Find notes with no connections to other notes.",
    {},
    async () => {
      try {
        const orphans = app.findOrphanedNotes.execute();

        if (orphans.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No orphaned notes found.",
              },
            ],
          };
        }

        let output = `Found ${orphans.length} orphaned notes:\n\n`;
        for (let i = 0; i < orphans.length; i++) {
          const note = orphans[i];
          output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
          if (note.tags.length > 0) {
            output += `   Tags: ${note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          const contentPreview = note.content.slice(0, 100).replace(/\n/g, " ");
          output += `   Preview: ${contentPreview}${note.content.length > 100 ? "..." : ""}\n\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_list_notes_by_date tool handler
 */
function registerListNotesByDate(server: McpServer, app: Application): void {
  server.tool(
    "zk_list_notes_by_date",
    "List notes created or updated within a date range.",
    {
      start_date: z
        .string()
        .optional()
        .describe("Start date in ISO format (YYYY-MM-DD)"),
      end_date: z
        .string()
        .optional()
        .describe("End date in ISO format (YYYY-MM-DD)"),
      use_updated: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to use updated_at instead of created_at"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of results to return"),
    },
    async (args) => {
      try {
        let startDateTime: Date | null = null;
        if (args.start_date) {
          startDateTime = new Date(`${args.start_date}T00:00:00`);
        }
        let endDateTime: Date | null = null;
        if (args.end_date) {
          endDateTime = new Date(`${args.end_date}T23:59:59`);
        }

        const notes = app.listNotesByDate.execute(
          startDateTime,
          endDateTime,
          args.use_updated ?? false,
        );

        const limit = args.limit ?? 10;
        const limitedNotes = notes.slice(0, limit);

        if (limitedNotes.length === 0) {
          const dateType = args.use_updated ? "updated" : "created";
          let dateRange = "";
          if (args.start_date && args.end_date) {
            dateRange = ` between ${args.start_date} and ${args.end_date}`;
          } else if (args.start_date) {
            dateRange = ` after ${args.start_date}`;
          } else if (args.end_date) {
            dateRange = ` before ${args.end_date}`;
          }
          return {
            content: [
              {
                type: "text" as const,
                text: `No notes found ${dateType}${dateRange}.`,
              },
            ],
          };
        }

        const dateType = args.use_updated ? "updated" : "created";
        let output = `Notes ${dateType}`;
        if (args.start_date || args.end_date) {
          if (args.start_date && args.end_date) {
            output += ` between ${args.start_date} and ${args.end_date}`;
          } else if (args.start_date) {
            output += ` after ${args.start_date}`;
          } else if (args.end_date) {
            output += ` before ${args.end_date}`;
          }
        }
        output += ` (showing ${limitedNotes.length} results):\n\n`;

        for (let i = 0; i < limitedNotes.length; i++) {
          const note = limitedNotes[i];
          const date = args.use_updated ? note.updatedAt : note.createdAt;
          output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
          output += `   ${dateType.charAt(0).toUpperCase() + dateType.slice(1)}: ${date.toISOString().slice(0, 16).replace("T", " ")}\n`;
          if (note.tags.length > 0) {
            output += `   Tags: ${note.tags.map((t: { name: string }) => t.name).join(", ")}\n`;
          }
          const contentPreview = note.content.slice(0, 100).replace(/\n/g, " ");
          output += `   Preview: ${contentPreview}${note.content.length > 100 ? "..." : ""}\n\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * zk_rebuild_index tool handler
 */
function registerRebuildIndex(server: McpServer, app: Application): void {
  server.tool(
    "zk_rebuild_index",
    "Rebuild the database index from files.",
    {},
    async () => {
      try {
        const result = app.rebuildIndex.execute();

        return {
          content: [
            {
              type: "text" as const,
              text: result.message,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatErrorResponse(error as Error),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
