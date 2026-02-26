/**
 * Types for SQLite index operations
 *
 * Defines the interface for efficient querying and indexing of notes
 * using SQLite database.
 *
 * @module infrastructure/persistence/sqlite-index
 */

import type Database from "better-sqlite3";
import type { Link, Note, Tag } from "../../../domain/entities/note/index.js";

/**
 * Query criteria for searching notes in the SQLite index
 */
export type SqliteIndexQueryCriteria = {
  /** Search in note content and title */
  content?: string;
  /** Search in note title (case-insensitive partial match) */
  title?: string;
  /** Filter by exact note type */
  noteType?: string;
  /** Filter by single tag */
  tag?: string;
  /** Filter by multiple tags (OR logic) */
  tags?: string[];
  /** Filter notes that link to this note ID */
  linkedTo?: string;
  /** Filter notes that are linked from this note ID */
  linkedFrom?: string;
  /** Filter notes created after this date */
  createdAfter?: Date;
  /** Filter notes created before this date */
  createdBefore?: Date;
  /** Filter notes updated after this date */
  updatedAfter?: Date;
  /** Filter notes updated before this date */
  updatedBefore?: Date;
};

/**
 * Direction for finding linked notes
 */
export type LinkDirection = "outgoing" | "incoming" | "both";

/**
 * Interface for SQLite index operations
 * Handles efficient querying and indexing of notes
 */
export type ISqliteIndex = {
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
   * @returns Array of note IDs matching the criteria
   */
  query(criteria: SqliteIndexQueryCriteria): string[];

  /**
   * Get all unique tags
   */
  getAllTags(): Tag[];

  /**
   * Find linked note IDs
   */
  findLinkedIds(noteId: string, direction: LinkDirection): string[];

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
};

/**
 * Configuration for SqliteIndex
 */
export type SqliteIndexConfig = {
  /** Active SQLite database connection */
  db: Database.Database;
};
