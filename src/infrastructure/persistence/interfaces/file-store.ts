/**
 * Interfaces for persistence layer implementations
 */

import type { Link, Note, Tag } from "../../../domain/entities/note.js";

/**
 * Interface for Markdown file storage operations
 * Handles reading/writing notes as Markdown files with YAML frontmatter
 */
export interface IMarkdownFileStore {
  /**
   * Write a note to a markdown file
   */
  write(note: Note): void;

  /**
   * Read a note from a markdown file by ID
   */
  read(id: string): Note | null;

  /**
   * Delete a note's markdown file
   */
  delete(id: string): void;

  /**
   * Check if a note file exists
   */
  exists(id: string): boolean;

  /**
   * List all note IDs (files) in the store
   */
  listIds(): string[];
}

/**
 * Interface for SQLite index operations
 * Handles efficient querying and indexing of notes
 */
export interface ISqliteIndex {
  /**
   * Initialize the database schema
   */
  initialize(): void;

  /**
   * Index a note in the database
   */
  indexNote(note: Note): void;

  /**
   * Remove a note from the index
   */
  removeNote(id: string): void;

  /**
   * Find a note ID by title
   */
  findIdByTitle(title: string): string | null;

  /**
   * List all note IDs in the index
   */
  listIds(): string[];

  /**
   * Query notes by search criteria
   */
  query(criteria: {
    content?: string;
    title?: string;
    noteType?: string;
    tag?: string;
    tags?: string[];
    linkedTo?: string;
    linkedFrom?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
  }): string[]; // Returns note IDs

  /**
   * Get all unique tags
   */
  getAllTags(): Tag[];

  /**
   * Find linked note IDs
   */
  findLinkedIds(
    noteId: string,
    direction: "outgoing" | "incoming" | "both",
  ): string[];

  /**
   * Get links for a note (outgoing)
   */
  getLinksForNote(noteId: string): Link[];

  /**
   * Get incoming links for a note
   */
  getIncomingLinksForNote(noteId: string): Link[];

  /**
   * Get count of notes in index
   */
  getCount(): number;

  /**
   * Clear all data from index
   */
  clear(): void;

  /**
   * Close database connection
   */
  close(): void;
}
