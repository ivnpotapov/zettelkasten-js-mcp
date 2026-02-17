/**
 * Service for searching and discovering notes in the Zettelkasten
 */

import { config } from "../config/index.js";
import type { Note, NoteType, SearchResult } from "../models/types.js";
import { createLogger } from "../utils/logger.js";
import { ZettelService } from "./zettel-service.js";

const _logger = createLogger("SearchService", config.logLevel);

export class SearchService {
  private zettelService: ZettelService;

  constructor(zettelService?: ZettelService) {
    this.zettelService = zettelService || new ZettelService();
  }

  /**
   * Initialize the service and dependencies
   */
  initialize(): void {
    this.zettelService.initialize();
  }

  /**
   * Search for notes by text content
   */
  searchByText(
    query: string,
    includeContent: boolean = true,
    includeTitle: boolean = true,
  ): SearchResult[] {
    if (!query) {
      return [];
    }

    // Normalize query
    const queryLower = query.toLowerCase();
    const queryTerms = new Set(queryLower.split(/\s+/));

    // Get all notes
    const allNotes = this.zettelService.getAllNotes();
    const results: SearchResult[] = [];

    for (const note of allNotes) {
      let score = 0;
      const matchedTerms = new Set<string>();
      let matchedContext = "";

      // Check title
      if (includeTitle && note.title) {
        const titleLower = note.title.toLowerCase();
        // Exact match in title is highest score
        if (titleLower.includes(queryLower)) {
          score += 2.0;
          matchedContext = `Title: ${note.title}`;
        }
        // Check for term matches in title
        for (const term of queryTerms) {
          if (titleLower.includes(term)) {
            score += 0.5;
            matchedTerms.add(term);
          }
        }
      }

      // Check content
      if (includeContent && note.content) {
        const contentLower = note.content.toLowerCase();
        // Exact match in content
        if (contentLower.includes(queryLower)) {
          score += 1.0;
          // Extract a snippet around the match
          const index = contentLower.indexOf(queryLower);
          const start = Math.max(0, index - 40);
          const end = Math.min(
            note.content.length,
            index + queryLower.length + 40,
          );
          const snippet = note.content.slice(start, end);
          matchedContext = `Content: ...${snippet}...`;
        }
        // Check for term matches in content
        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 0.2;
            matchedTerms.add(term);
          }
        }
      }

      // Add to results if score is positive
      if (score > 0) {
        results.push({
          note,
          score,
          matchedTerms,
          matchedContext,
        });
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Search for notes by tags
   */
  searchByTag(tags: string | string[]): Note[] {
    if (typeof tags === "string") {
      return this.zettelService.getNotesByTag(tags);
    }

    // If we have multiple tags, find notes with any of the tags
    const _allMatchingNotes: Note[] = [];
    const uniqueNotes = new Map<string, Note>();

    for (const tag of tags) {
      const notes = this.zettelService.getNotesByTag(tag);
      for (const note of notes) {
        uniqueNotes.set(note.id, note);
      }
    }

    return Array.from(uniqueNotes.values());
  }

  /**
   * Search for notes linked to/from a note
   */
  searchByLink(
    noteId: string,
    direction: "outgoing" | "incoming" | "both" = "both",
  ): Note[] {
    return this.zettelService.getLinkedNotes(noteId, direction);
  }

  /**
   * Find orphaned notes (no incoming or outgoing links)
   */
  findOrphanedNotes(): Note[] {
    const repository = this.zettelService.getRepository();
    const allNotes = this.zettelService.getAllNotes();
    const orphans: Note[] = [];

    for (const note of allNotes) {
      const outgoingLinks = repository.findLinkedNotes(note.id, "outgoing");
      const incomingLinks = repository.findLinkedNotes(note.id, "incoming");

      if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
        orphans.push(note);
      }
    }

    return orphans;
  }

  /**
   * Find notes with the most connections (incoming + outgoing links)
   */
  findCentralNotes(limit: number = 10): Array<[Note, number]> {
    const repository = this.zettelService.getRepository();
    const allNotes = this.zettelService.getAllNotes();
    const noteConnections: Array<[Note, number]> = [];

    for (const note of allNotes) {
      const outgoingLinks = repository.findLinkedNotes(note.id, "outgoing");
      const incomingLinks = repository.findLinkedNotes(note.id, "incoming");

      // Note: findLinkedNotes returns Note objects, we need to count unique connections
      const _outgoingIds = new Set(outgoingLinks.map((n) => n.id));
      const _incomingIds = new Set(incomingLinks.map((n) => n.id));

      // Get link counts from repository for accurate counting
      const outgoingLinksData = repository.getLinksForNote(note.id);
      const incomingLinksData = repository.getIncomingLinksForNote(note.id);

      const totalConnections =
        outgoingLinksData.length + incomingLinksData.length;

      if (totalConnections > 0) {
        noteConnections.push([note, totalConnections]);
      }
    }

    // Sort by total connections (descending)
    noteConnections.sort((a, b) => b[1] - a[1]);

    // Return top N notes
    return noteConnections.slice(0, limit);
  }

  /**
   * Find notes created or updated within a date range
   */
  findNotesByDateRange(
    startDate: Date | null = null,
    endDate: Date | null = null,
    useUpdated: boolean = false,
  ): Note[] {
    const allNotes = this.zettelService.getAllNotes();
    const matchingNotes: Note[] = [];

    for (const note of allNotes) {
      // Get the relevant date
      const date = useUpdated ? note.updatedAt : note.createdAt;

      // Check if in range
      if (startDate && date < startDate) {
        continue;
      }
      if (endDate && date > endDate) {
        continue;
      }

      matchingNotes.push(note);
    }

    // Sort by date (descending)
    matchingNotes.sort((a, b) => {
      const aDate = useUpdated ? a.updatedAt : a.createdAt;
      const bDate = useUpdated ? b.updatedAt : b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return matchingNotes;
  }

  /**
   * Find notes similar to the given note
   */
  findSimilarNotes(noteId: string): Array<[Note, number]> {
    return this.zettelService.findSimilarNotes(noteId);
  }

  /**
   * Perform a combined search with multiple criteria
   */
  searchCombined(options: {
    text?: string;
    tags?: string[];
    noteType?: NoteType;
    startDate?: Date;
    endDate?: Date;
  }): SearchResult[] {
    // Start with all notes
    const allNotes = this.zettelService.getAllNotes();

    // Filter by criteria
    const filteredNotes: Note[] = [];

    for (const note of allNotes) {
      // Check note type
      if (options.noteType && note.noteType !== options.noteType) {
        continue;
      }

      // Check date range
      if (options.startDate && note.createdAt < options.startDate) {
        continue;
      }
      if (options.endDate && note.createdAt > options.endDate) {
        continue;
      }

      // Check tags
      if (options.tags && options.tags.length > 0) {
        const noteTagNames = new Set(note.tags.map((t) => t.name));
        if (![...options.tags].some((tag) => noteTagNames.has(tag))) {
          continue;
        }
      }

      // Made it through all filters
      filteredNotes.push(note);
    }

    // If we have a text query, score the notes
    const results: SearchResult[] = [];

    if (options.text) {
      const textLower = options.text.toLowerCase();
      const queryTerms = new Set(textLower.split(/\s+/));

      for (const note of filteredNotes) {
        let score = 0;
        const matchedTerms = new Set<string>();
        let matchedContext = "";

        // Check title
        const titleLower = note.title.toLowerCase();
        if (titleLower.includes(textLower)) {
          score += 2.0;
          matchedContext = `Title: ${note.title}`;
        }

        for (const term of queryTerms) {
          if (titleLower.includes(term)) {
            score += 0.5;
            matchedTerms.add(term);
          }
        }

        // Check content
        const contentLower = note.content.toLowerCase();
        if (contentLower.includes(textLower)) {
          score += 1.0;
          const index = contentLower.indexOf(textLower);
          const start = Math.max(0, index - 40);
          const end = Math.min(
            note.content.length,
            index + textLower.length + 40,
          );
          const snippet = note.content.slice(start, end);
          matchedContext = `Content: ...${snippet}...`;
        }

        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 0.2;
            matchedTerms.add(term);
          }
        }

        // Add to results if score is positive
        if (score > 0) {
          results.push({
            note,
            score,
            matchedTerms,
            matchedContext,
          });
        }
      }
    } else {
      // If no text query, just add all filtered notes with a default score
      for (const note of filteredNotes) {
        results.push({
          note,
          score: 1.0,
          matchedTerms: new Set(),
          matchedContext: "",
        });
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}
