/**
 * SQLite-based index implementation for efficient note querying
 * Handles database operations while delegating file storage to MarkdownFileStore
 */

import type Database from "better-sqlite3";
import type { Link, Note, Tag } from "../../domain/entities/note.js";
import { LinkType, NoteType } from "../../models/types.js";
import { createLogger } from "../../utils/logger.js";
import type { ISqliteIndex } from "./interfaces/file-store.js";

const logger = createLogger(
  "SqliteIndex",
  process.env.ZETTELKASTEN_LOG_LEVEL ?? "INFO",
);

/**
 * Database link record
 */
interface DBLink {
  source_id: string;
  target_id: string;
  link_type: string;
  description: string | null;
  created_at: string;
}

/**
 * Configuration for SqliteIndex
 */
export interface SqliteIndexConfig {
  db: Database.Database;
}

/**
 * SQLite-based index for Zettelkasten notes
 */
export class SqliteIndex implements ISqliteIndex {
  private readonly db: Database.Database;
  private initialized = false;

  constructor(config: SqliteIndexConfig) {
    this.db = config.db;
  }

  /**
   * Initialize the database schema
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Create notes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        note_type TEXT NOT NULL DEFAULT '${NoteType.PERMANENT}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      );
    `);

    // Create note_tags association table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);

    // Create links table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        link_type TEXT NOT NULL DEFAULT '${LinkType.REFERENCE}',
        description TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(source_id, target_id, link_type),
        FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES notes(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
      CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
      CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
      CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
    `);

    this.initialized = true;
    logger.debug("Database schema initialized");
  }

  /**
   * Index a note in the database
   */
  indexNote(note: Note): void {
    this.initialize();

    const insertNote = this.db.prepare(`
      INSERT INTO notes (id, title, content, note_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        note_type = excluded.note_type,
        updated_at = excluded.updated_at
    `);

    const deleteLinks = this.db.prepare(
      "DELETE FROM links WHERE source_id = ?",
    );
    const deleteNoteTags = this.db.prepare(
      "DELETE FROM note_tags WHERE note_id = ?",
    );

    const insertTag = this.db.prepare(
      "INSERT OR IGNORE INTO tags (name) VALUES (?)",
    );
    const getTag = this.db.prepare("SELECT id FROM tags WHERE name = ?");
    const insertNoteTag = this.db.prepare(
      "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
    );

    const insertLink = this.db.prepare(`
      INSERT OR IGNORE INTO links (source_id, target_id, link_type, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Insert or update note
    insertNote.run(
      note.id,
      note.title,
      note.content,
      note.noteType,
      note.createdAt.toISOString(),
      note.updatedAt.toISOString(),
    );

    // Clear existing links and tags
    deleteLinks.run(note.id);
    deleteNoteTags.run(note.id);

    // Add tags
    for (const tag of note.tags) {
      insertTag.run(tag.name);
      const tagResult = getTag.get(tag.name) as { id: number } | undefined;
      if (tagResult) {
        insertNoteTag.run(note.id, tagResult.id);
      }
    }

    // Add links
    for (const link of note.links) {
      insertLink.run(
        link.sourceId,
        link.targetId,
        link.linkType,
        link.description || null,
        link.createdAt.toISOString(),
      );
    }
  }

  /**
   * Remove a note from the index
   */
  removeNote(id: string): void {
    this.initialize();
    this.db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  }

  /**
   * Find a note ID by title
   */
  findIdByTitle(title: string): string | null {
    this.initialize();
    const row = this.db
      .prepare("SELECT id FROM notes WHERE title = ?")
      .get(title) as { id: string } | undefined;
    return row?.id ?? null;
  }

  /**
   * List all note IDs in the index
   */
  listIds(): string[] {
    this.initialize();
    const rows = this.db.prepare("SELECT id FROM notes").all() as Array<{
      id: string;
    }>;
    return rows.map((r) => r.id);
  }

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
  }): string[] {
    this.initialize();

    let query = "SELECT DISTINCT n.id FROM notes n";
    const conditions: string[] = [];
    const params: (string | Date)[] = [];

    // Join with links if needed
    if (criteria.linkedTo || criteria.linkedFrom) {
      query += " LEFT JOIN links l ON n.id = l.source_id OR n.id = l.target_id";
    }

    // Join with tags if needed
    if (criteria.tag || criteria.tags) {
      query +=
        " LEFT JOIN note_tags nt ON n.id = nt.note_id LEFT JOIN tags t ON nt.tag_id = t.id";
    }

    // Build conditions
    if (criteria.content) {
      conditions.push("(n.content LIKE ? OR n.title LIKE ?)");
      const pattern = `%${criteria.content}%`;
      params.push(pattern, pattern);
    }

    if (criteria.title) {
      conditions.push("LOWER(n.title) LIKE LOWER(?)");
      params.push(`%${criteria.title}%`);
    }

    if (criteria.noteType) {
      conditions.push("n.note_type = ?");
      params.push(criteria.noteType);
    }

    if (criteria.tag) {
      conditions.push("t.name = ?");
      params.push(criteria.tag);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      const placeholders = criteria.tags.map(() => "?").join(", ");
      conditions.push(`t.name IN (${placeholders})`);
      params.push(...criteria.tags);
    }

    if (criteria.linkedTo) {
      conditions.push("(l.target_id = ? AND l.source_id = n.id)");
      params.push(criteria.linkedTo);
    }

    if (criteria.linkedFrom) {
      conditions.push("(l.source_id = ? AND l.target_id = n.id)");
      params.push(criteria.linkedFrom);
    }

    if (criteria.createdAfter) {
      conditions.push("n.created_at >= ?");
      params.push(criteria.createdAfter);
    }

    if (criteria.createdBefore) {
      conditions.push("n.created_at <= ?");
      params.push(criteria.createdBefore);
    }

    if (criteria.updatedAfter) {
      conditions.push("n.updated_at >= ?");
      params.push(criteria.updatedAfter);
    }

    if (criteria.updatedBefore) {
      conditions.push("n.updated_at <= ?");
      params.push(criteria.updatedBefore);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const rows = this.db.prepare(query).all(...params) as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }

  /**
   * Get all unique tags
   */
  getAllTags(): Tag[] {
    this.initialize();
    const rows = this.db.prepare("SELECT name FROM tags").all() as Array<{
      name: string;
    }>;
    return rows.map((r) => ({ name: r.name }));
  }

  /**
   * Find linked note IDs
   */
  findLinkedIds(
    noteId: string,
    direction: "outgoing" | "incoming" | "both",
  ): string[] {
    this.initialize();

    let query = "SELECT DISTINCT n.id FROM notes n JOIN links l ON ";

    if (direction === "outgoing") {
      query += "n.id = l.target_id WHERE l.source_id = ?";
    } else if (direction === "incoming") {
      query += "n.id = l.source_id WHERE l.target_id = ?";
    } else {
      query +=
        "((n.id = l.target_id AND l.source_id = ?) OR (n.id = l.source_id AND l.target_id = ?))";
    }

    const params = direction === "both" ? [noteId, noteId] : [noteId];
    const rows = this.db.prepare(query).all(...params) as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }

  /**
   * Get links for a note (outgoing)
   */
  getLinksForNote(noteId: string): Link[] {
    this.initialize();
    const rows = this.db
      .prepare("SELECT * FROM links WHERE source_id = ?")
      .all(noteId) as DBLink[];
    return this.mapDbLinksToLinks(noteId, rows);
  }

  /**
   * Get incoming links for a note
   */
  getIncomingLinksForNote(noteId: string): Link[] {
    this.initialize();
    const rows = this.db
      .prepare("SELECT * FROM links WHERE target_id = ?")
      .all(noteId) as DBLink[];
    return this.mapDbLinksToLinks(noteId, rows);
  }

  /**
   * Map database link records to domain Link objects
   */
  private mapDbLinksToLinks(sourceId: string, rows: DBLink[]): Link[] {
    return rows.map((row) => ({
      sourceId: row.source_id,
      targetId: row.target_id,
      linkType: row.link_type as LinkType,
      description: row.description ?? undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get count of notes in index
   */
  getCount(): number {
    this.initialize();
    const result = this.db
      .prepare("SELECT COUNT(*) as count FROM notes")
      .get() as { count: number };
    return result.count;
  }

  /**
   * Clear all data from index
   */
  clear(): void {
    this.initialize();
    this.db.exec("DELETE FROM links");
    this.db.exec("DELETE FROM note_tags");
    this.db.exec("DELETE FROM tags");
    this.db.exec("DELETE FROM notes");
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
