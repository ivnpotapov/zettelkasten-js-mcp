/**
 * Dual storage repository implementation
 * Composes MarkdownFileStore and SqliteIndex to implement INoteRepository
 * Maintains Markdown files as source of truth with SQLite as index
 */

import type { Link, Note, Tag } from "../../domain/entities/note/index.js";
import type {
  INoteRepository,
  SearchOptions,
} from "../../domain/interfaces/repository.js";
import { createLogger } from "../../utils/logger.js";
import type { IMarkdownFileStore } from "./markdown-file-store/types.js";
import type { ISqliteIndex } from "./sqlite-index/types.js";

const logger = createLogger(
  "DualStorageNoteRepository",
  process.env.ZETTELKASTEN_LOG_LEVEL ?? "INFO",
);

/**
 * Repository that combines filesystem (Markdown) and database (SQLite) storage
 * - Markdown files are the source of truth
 * - SQLite index enables efficient querying
 */
export class DualStorageNoteRepository implements INoteRepository {
  constructor(
    private readonly fileStore: IMarkdownFileStore,
    private readonly index: ISqliteIndex,
  ) {
    // Initialize index on first access
    this.index.initialize();
    this.rebuildIndexIfNeeded();
  }

  /**
   * Rebuild index if file count doesn't match database count
   */
  private rebuildIndexIfNeeded(): void {
    const fileCount = this.fileStore.listIds().length;
    const dbCount = this.index.getCount();

    if (fileCount !== dbCount) {
      logger.info(
        `Index out of sync: ${dbCount} in DB, ${fileCount} files. Rebuilding...`,
      );
      this.rebuildIndex();
    }
  }

  /**
   * Create a new note (writes to both filesystem and index)
   */
  create(note: Note): Note {
    // Write to filesystem first (source of truth)
    this.fileStore.write(note);
    // Then update index
    this.index.indexNote(note);

    logger.debug(`Created note ${note.id}`);
    return note;
  }

  /**
   * Get a note by ID (reads from filesystem)
   */
  get(id: string): Note | null {
    return this.fileStore.read(id);
  }

  /**
   * Get a note by title (queries index, then reads from filesystem)
   */
  getByTitle(title: string): Note | null {
    const id = this.index.findIdByTitle(title);
    if (!id) {
      return null;
    }
    return this.fileStore.read(id);
  }

  /**
   * Get all notes
   */
  getAll(): Note[] {
    const ids = this.index.listIds();
    const notes: Note[] = [];

    for (const id of ids) {
      const note = this.fileStore.read(id);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Update an existing note (writes to both filesystem and index)
   */
  update(note: Note): Note {
    // Verify note exists
    const existing = this.fileStore.read(note.id);
    if (!existing) {
      throw new Error(`Note with ID ${note.id} does not exist`);
    }

    // Update timestamp
    note.updatedAt = new Date();

    // Write to filesystem and update index
    this.fileStore.write(note);
    this.index.indexNote(note);

    logger.debug(`Updated note ${note.id}`);
    return note;
  }

  /**
   * Delete a note by ID (removes from both filesystem and index)
   */
  delete(id: string): void {
    // Verify note exists
    if (!this.fileStore.exists(id)) {
      throw new Error(`Note with ID ${id} does not exist`);
    }

    // Delete from filesystem and index
    this.fileStore.delete(id);
    this.index.removeNote(id);

    logger.debug(`Deleted note ${id}`);
  }

  /**
   * Search for notes based on criteria
   */
  search(options: SearchOptions): Note[] {
    const ids = this.index.query(options);
    const notes: Note[] = [];

    for (const id of ids) {
      const note = this.fileStore.read(id);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Find notes by tag
   */
  findByTag(tag: string): Note[] {
    return this.search({ tag });
  }

  /**
   * Find notes linked to/from a given note
   */
  findLinkedNotes(
    noteId: string,
    direction: "outgoing" | "incoming" | "both",
  ): Note[] {
    const ids = this.index.findLinkedIds(noteId, direction);
    const notes: Note[] = [];

    for (const id of ids) {
      const note = this.fileStore.read(id);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Get all unique tags across all notes
   */
  getAllTags(): Tag[] {
    return this.index.getAllTags();
  }

  /**
   * Get all links for a specific note (outgoing)
   */
  getLinksForNote(noteId: string): Link[] {
    return this.index.getLinksForNote(noteId);
  }

  /**
   * Get all incoming links for a specific note
   */
  getIncomingLinksForNote(noteId: string): Link[] {
    return this.index.getIncomingLinksForNote(noteId);
  }

  /**
   * Rebuild the database index from all markdown files
   */
  rebuildIndex(): void {
    logger.info("Rebuilding index from markdown files...");

    // Clear existing index
    this.index.clear();

    // Get all note IDs from filesystem
    const noteIds = this.fileStore.listIds();
    logger.debug(`Found ${noteIds.length} note files to index`);

    // Process files in batches
    const batchSize = 100;
    for (let i = 0; i < noteIds.length; i += batchSize) {
      const batch = noteIds.slice(i, i + batchSize);

      for (const id of batch) {
        try {
          const note = this.fileStore.read(id);
          if (note) {
            this.index.indexNote(note);
          }
        } catch (error) {
          logger.error(`Error indexing note ${id}: ${error}`);
        }
      }
    }

    logger.info(`Index rebuild complete: ${noteIds.length} notes indexed`);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.index.close();
  }
}
