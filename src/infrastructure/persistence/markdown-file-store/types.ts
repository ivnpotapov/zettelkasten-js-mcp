/**
 * Types for Markdown file storage operations
 *
 * Defines the interface for reading/writing notes as Markdown files
 * with YAML frontmatter.
 *
 * @module infrastructure/persistence/markdown-file-store
 */

import type { Note } from "../../../domain/entities/note/index.js";

/**
 * Interface for Markdown file storage operations
 * Handles reading/writing notes as Markdown files with YAML frontmatter
 */
export type IMarkdownFileStore = {
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
};

/**
 * Configuration for MarkdownFileStore
 */
export type MarkdownFileStoreConfig = {
  /** Directory path where markdown note files are stored */
  notesDirectory: string;
};
