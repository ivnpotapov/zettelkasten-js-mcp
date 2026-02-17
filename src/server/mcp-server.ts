/**
 * MCP server implementation for the Zettelkasten
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { config } from "../config/index.js";
import { LinkType, NoteType } from "../models/types.js";
import { SearchService } from "../services/search-service.js";
import { ZettelService } from "../services/zettel-service.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("MCPServer", config.logLevel);

export class ZettelkastenMcpServer {
  private server: McpServer;
  private zettelService: ZettelService;
  private searchService: SearchService;

  constructor() {
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

    // Initialize services
    this.zettelService = new ZettelService();
    this.searchService = new SearchService(this.zettelService);

    // Initialize services
    this.initialize();

    // Register tool handlers
    this.registerTools();
  }

  /**
   * Initialize the server and services
   */
  private initialize(): void {
    this.zettelService.initialize();
    this.searchService.initialize();
    logger.info("Zettelkasten MCP server initialized");
  }

  /**
   * Format an error response in a consistent way
   */
  private formatErrorResponse(error: Error): string {
    const errorId = Math.random().toString(36).substring(2, 10);

    if (
      error.message.includes("not found") ||
      error.message.includes("does not exist")
    ) {
      logger.error(`Not found error [${errorId}]: ${error.message}`);
      return `Error: ${error.message}`;
    } else if (
      error.message.includes("required") ||
      error.message.includes("Invalid")
    ) {
      logger.error(`Validation error [${errorId}]: ${error.message}`);
      return `Error: ${error.message}`;
    } else {
      logger.error(`Unexpected error [${errorId}]: ${error.message}`, error);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Register all tools
   */
  private registerTools(): void {
    // zk_create_note
    this.server.tool(
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
          // Convert note_type string to enum
          let noteType = NoteType.PERMANENT;
          if (args.note_type) {
            const typeValues = Object.values(NoteType);
            if (typeValues.includes(args.note_type as NoteType)) {
              noteType = args.note_type as NoteType;
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid note type: ${args.note_type}. Valid types are: ${typeValues.join(", ")}`,
                  },
                ],
              };
            }
          }

          // Convert tags string to list
          let tagList: string[] = [];
          if (args.tags) {
            tagList = args.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t);
          }

          // Create the note
          const note = this.zettelService.createNote({
            title: args.title,
            content: args.content,
            noteType,
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_get_note
    this.server.tool(
      "zk_get_note",
      "Retrieve a note by ID or title.",
      {
        identifier: z.string().describe("The ID or title of the note"),
      },
      async (args) => {
        try {
          // Try to get by ID first
          let note = this.zettelService.getNote(args.identifier);
          // If not found, try by title
          if (!note) {
            note = this.zettelService.getNoteByTitle(args.identifier);
          }
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

          // Format the note
          const { formatNoteForDisplay } = await import("../utils/markdown.js");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_update_note
    this.server.tool(
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
          // Get the note
          const note = this.zettelService.getNote(args.note_id);
          if (!note) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Note not found: ${args.note_id}`,
                },
              ],
            };
          }

          // Convert note_type string to enum if provided
          let noteType: NoteType | undefined;
          if (args.note_type) {
            const typeValues = Object.values(NoteType);
            if (typeValues.includes(args.note_type as NoteType)) {
              noteType = args.note_type as NoteType;
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid note type: ${args.note_type}. Valid types are: ${typeValues.join(", ")}`,
                  },
                ],
              };
            }
          }

          // Convert tags string to list if provided
          let tagList: string[] | undefined;
          if (args.tags !== undefined) {
            tagList = args.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t);
          }

          // Update the note
          const updatedNote = this.zettelService.updateNote({
            noteId: args.note_id,
            title: args.title,
            content: args.content,
            noteType,
            tags: tagList,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: `Note updated successfully: ${updatedNote.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_delete_note
    this.server.tool(
      "zk_delete_note",
      "Delete a note.",
      {
        note_id: z.string().describe("The ID of the note to delete"),
      },
      async (args) => {
        try {
          // Check if note exists
          const note = this.zettelService.getNote(args.note_id);
          if (!note) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Note not found: ${args.note_id}`,
                },
              ],
            };
          }

          // Delete the note
          this.zettelService.deleteNote(args.note_id);
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_create_link
    this.server.tool(
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
          // Convert link_type string to enum
          let linkType = LinkType.REFERENCE;
          if (args.link_type) {
            const typeValues = Object.values(LinkType);
            if (typeValues.includes(args.link_type as LinkType)) {
              linkType = args.link_type as LinkType;
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid link type: ${args.link_type}. Valid types are: ${typeValues.join(", ")}`,
                  },
                ],
              };
            }
          }

          // Create the link
          this.zettelService.createLink({
            sourceId: args.source_id,
            targetId: args.target_id,
            linkType,
            description: args.description,
            bidirectional: args.bidirectional || false,
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_remove_link
    this.server.tool(
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
          // Remove the link
          this.zettelService.removeLink(
            args.source_id,
            args.target_id,
            args.bidirectional || false,
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_search_notes
    this.server.tool(
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
          // Convert tags string to list if provided
          let tagList: string[] | undefined;
          if (args.tags) {
            tagList = args.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t);
          }

          // Convert note_type string to enum if provided
          let noteType: NoteType | undefined;
          if (args.note_type) {
            const typeValues = Object.values(NoteType);
            if (typeValues.includes(args.note_type as NoteType)) {
              noteType = args.note_type as NoteType;
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid note type: ${args.note_type}. Valid types are: ${typeValues.join(", ")}`,
                  },
                ],
              };
            }
          }

          // Perform search
          const results = this.searchService.searchCombined({
            text: args.query,
            tags: tagList,
            noteType,
          });

          // Limit results
          const limit = args.limit || 10;
          const limitedResults = results.slice(0, limit);

          if (limitedResults.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "No matching notes found.",
                },
              ],
            };
          }

          // Format results
          let output = `Found ${limitedResults.length} matching notes:\n\n`;
          for (let i = 0; i < limitedResults.length; i++) {
            const result = limitedResults[i];
            const note = result.note;
            output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
            if (note.tags.length > 0) {
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            output += `   Created: ${note.createdAt.toISOString().split("T")[0]}\n`;
            const contentPreview = note.content
              .slice(0, 150)
              .replace(/\n/g, " ");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_get_linked_notes
    this.server.tool(
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
          const direction = args.direction || "both";

          // Get linked notes
          const linkedNotes = this.zettelService.getLinkedNotes(
            args.note_id,
            direction,
          );
          if (linkedNotes.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `No ${direction} links found for note ${args.note_id}.`,
                },
              ],
            };
          }

          // Format results
          let output = `Found ${linkedNotes.length} ${direction} linked notes for ${args.note_id}:\n\n`;
          for (let i = 0; i < linkedNotes.length; i++) {
            const note = linkedNotes[i];
            output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
            if (note.tags.length > 0) {
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            // Try to determine link type
            const sourceNote = this.zettelService.getNote(args.note_id);
            if (sourceNote) {
              for (const link of sourceNote.links) {
                if (link.targetId === note.id) {
                  output += `   Link type: ${link.linkType}\n`;
                  if (link.description) {
                    output += `   Description: ${link.description}\n`;
                  }
                  break;
                }
              }
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_get_all_tags
    this.server.tool(
      "zk_get_all_tags",
      "Get all tags in the Zettelkasten.",
      {},
      async () => {
        try {
          const tags = this.zettelService.getAllTags();
          if (tags.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "No tags found in the Zettelkasten.",
                },
              ],
            };
          }

          // Sort alphabetically
          tags.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
          );

          // Format results
          let output = `Found ${tags.length} tags:\n\n`;
          for (let i = 0; i < tags.length; i++) {
            output += `${i + 1}. ${tags[i].name}\n`;
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_find_similar_notes
    this.server.tool(
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

          // Get similar notes
          const similarNotes = this.zettelService.findSimilarNotes(
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

          // Format results
          let output = `Found ${limitedNotes.length} similar notes for ${args.note_id}:\n\n`;
          for (let i = 0; i < limitedNotes.length; i++) {
            const [note, similarity] = limitedNotes[i];
            output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
            output += `   Similarity: ${similarity.toFixed(2)}\n`;
            if (note.tags.length > 0) {
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            const contentPreview = note.content
              .slice(0, 100)
              .replace(/\n/g, " ");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_find_central_notes
    this.server.tool(
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

          // Get central notes
          const centralNotes = this.searchService.findCentralNotes(limit);

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

          // Format results
          let output =
            "Central notes in the Zettelkasten (most connected):\n\n";
          for (let i = 0; i < centralNotes.length; i++) {
            const [note, connectionCount] = centralNotes[i];
            output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
            output += `   Connections: ${connectionCount}\n`;
            if (note.tags.length > 0) {
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            const contentPreview = note.content
              .slice(0, 100)
              .replace(/\n/g, " ");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_find_orphaned_notes
    this.server.tool(
      "zk_find_orphaned_notes",
      "Find notes with no connections to other notes.",
      {},
      async () => {
        try {
          // Get orphaned notes
          const orphans = this.searchService.findOrphanedNotes();

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

          // Format results
          let output = `Found ${orphans.length} orphaned notes:\n\n`;
          for (let i = 0; i < orphans.length; i++) {
            const note = orphans[i];
            output += `${i + 1}. ${note.title} (ID: ${note.id})\n`;
            if (note.tags.length > 0) {
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            const contentPreview = note.content
              .slice(0, 100)
              .replace(/\n/g, " ");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_list_notes_by_date
    this.server.tool(
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
          // Parse dates
          let startDateTime: Date | null = null;
          if (args.start_date) {
            startDateTime = new Date(`${args.start_date}T00:00:00`);
          }
          let endDateTime: Date | null = null;
          if (args.end_date) {
            endDateTime = new Date(`${args.end_date}T23:59:59`);
          }

          // Get notes
          const notes = this.searchService.findNotesByDateRange(
            startDateTime,
            endDateTime,
            args.use_updated || false,
          );

          // Limit results
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

          // Format results
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
              output += `   Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
            }
            const contentPreview = note.content
              .slice(0, 100)
              .replace(/\n/g, " ");
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
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );

    // zk_rebuild_index
    this.server.tool(
      "zk_rebuild_index",
      "Rebuild the database index from files.",
      {},
      async () => {
        try {
          // Get count before rebuild
          const noteCountBefore = this.zettelService.getAllNotes().length;

          // Perform the rebuild
          this.zettelService.rebuildIndex();

          // Get count after rebuild
          const noteCountAfter = this.zettelService.getAllNotes().length;

          return {
            content: [
              {
                type: "text" as const,
                text: `Database index rebuilt successfully.\nNotes processed: ${noteCountAfter}\nChange in note count: ${noteCountAfter - noteCountBefore}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: this.formatErrorResponse(error as Error),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  /**
   * Run the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("Zettelkasten MCP server running");
  }
}
