/**
 * Domain interfaces for repository implementations
 * Following dependency inversion principle - infrastructure implements these
 */

import type { Link, LinkType, Note, NoteType, Tag } from "../entities/note.js";

/**
 * Search options for finding notes
 */
export interface SearchOptions {
  content?: string;
  title?: string;
  noteType?: NoteType | string;
  tag?: string;
  tags?: string[];
  linkedTo?: string;
  linkedFrom?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

/**
 * Repository interface for note persistence operations
 * Implementations must handle both Markdown files and SQLite index
 */
export interface INoteRepository {
  /**
   * Create a new note (writes to both filesystem and index)
   */
  create(note: Note): Note;

  /**
   * Get a note by ID (reads from filesystem)
   */
  get(id: string): Note | null;

  /**
   * Get a note by title (queries index, then reads from filesystem)
   */
  getByTitle(title: string): Note | null;

  /**
   * Get all notes
   */
  getAll(): Note[];

  /**
   * Update an existing note (writes to both filesystem and index)
   */
  update(note: Note): Note;

  /**
   * Delete a note by ID (removes from both filesystem and index)
   */
  delete(id: string): void;

  /**
   * Search for notes based on criteria
   */
  search(options: SearchOptions): Note[];

  /**
   * Find notes by tag
   */
  findByTag(tag: string): Note[];

  /**
   * Find notes linked to/from a given note
   */
  findLinkedNotes(
    noteId: string,
    direction: "outgoing" | "incoming" | "both",
  ): Note[];

  /**
   * Get all unique tags across all notes
   */
  getAllTags(): Tag[];

  /**
   * Get all links for a specific note (outgoing)
   */
  getLinksForNote(noteId: string): Link[];

  /**
   * Get all incoming links for a specific note
   */
  getIncomingLinksForNote(noteId: string): Link[];

  /**
   * Rebuild the database index from all markdown files
   */
  rebuildIndex(): void;

  /**
   * Close database connection
   */
  close?(): void;
}
