/**
 * Use case: Search notes
 * Comprehensive search with multiple criteria support
 */

import type { Note, SearchResult } from "../../domain/entities/note.js";
import { NoteType } from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Search input options
 */
export interface SearchInput {
  query?: string;
  tags?: string[];
  noteType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Use case for searching Zettelkasten notes
 */
export class SearchNotesUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute combined search
   */
  search(input: SearchInput): SearchResult[] {
    const results: SearchResult[] = [];

    // Get all notes as base
    let notes = this.noteRepo.getAll();

    // Apply filters
    notes = notes.filter((note) => {
      // Note type filter
      if (input.noteType && note.noteType !== input.noteType) {
        return false;
      }

      // Date range filter
      if (input.startDate && note.createdAt < input.startDate) {
        return false;
      }
      if (input.endDate && note.createdAt > input.endDate) {
        return false;
      }

      // Tags filter (OR logic - any tag matches)
      if (input.tags && input.tags.length > 0) {
        const noteTagNames = new Set(note.tags.map((t) => t.name));
        if (![...input.tags].some((tag) => noteTagNames.has(tag))) {
          return false;
        }
      }

      return true;
    });

    // Apply text search and score
    if (input.query) {
      const queryLower = input.query.toLowerCase();
      const queryTerms = new Set(queryLower.split(/\s+/));

      for (const note of notes) {
        let score = 0;
        const matchedTerms = new Set<string>();
        let matchedContext = "";

        // Check title
        const titleLower = note.title.toLowerCase();
        if (titleLower.includes(queryLower)) {
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
        if (contentLower.includes(queryLower)) {
          score += 1.0;
          const index = contentLower.indexOf(queryLower);
          const start = Math.max(0, index - 40);
          const end = Math.min(
            note.content.length,
            index + queryLower.length + 40,
          );
          matchedContext = `Content: ...${note.content.slice(start, end)}...`;
        }
        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 0.2;
            matchedTerms.add(term);
          }
        }

        if (score > 0) {
          results.push({ note, score, matchedTerms, matchedContext });
        }
      }
    } else {
      // No text query - return all filtered with default score
      for (const note of notes) {
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

    // Apply limit
    const limit = input.limit ?? results.length;
    return results.slice(0, limit);
  }

  /**
   * Search by tag
   */
  byTag(tag: string): Note[] {
    return this.noteRepo.findByTag(tag);
  }

  /**
   * Search by multiple tags (OR logic)
   */
  byTags(tags: string[]): Note[] {
    const uniqueNotes = new Map<string, Note>();

    for (const tag of tags) {
      const notes = this.noteRepo.findByTag(tag);
      for (const note of notes) {
        uniqueNotes.set(note.id, note);
      }
    }

    return Array.from(uniqueNotes.values());
  }
}
