/**
 * SQLite Database initialization utilities
 *
 * This module provides a standalone function to initialize a SQLite database
 * for the Zettelkasten system. It creates the necessary schema for notes,
 * tags, and links with proper indexes for efficient querying.
 *
 * @module infrastructure/persistence/sqlite-database-init
 */

import Database from "better-sqlite3";

import { config } from "../../config/index.js";
import { LINK_TYPE, NOTE_TYPE } from "../../models/note/constants.js";
import { getDatabasePath } from "../../utils/path/get-database-path.js";

/**
 * Initialize SQLite database and create schema
 *
 * Creates a new SQLite database connection at the configured path,
 * enables foreign keys, and creates all necessary tables and indexes
 * if they don't already exist.
 *
 * @returns {Database.Database} Active SQLite database connection
 *
 * @example
 * ```ts
 * import { initSqliteDatabase } from "../infrastructure/index.js";
 *
 * const db = initSqliteDatabase();
 * // Use db for queries...
 * db.close();
 * ```
 */
export function initSqliteDatabase(): Database.Database {
  const dbPath = getDatabasePath(config.databasePath);
  const db = new Database(dbPath);

  // Enable foreign keys for referential integrity
  db.pragma("foreign_keys = ON");

  // Create notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      note_type TEXT NOT NULL DEFAULT '${NOTE_TYPE.PERMANENT}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Create note_tags association table (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Create links table (bidirectional relationships)
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      link_type TEXT NOT NULL DEFAULT '${LINK_TYPE.REFERENCE}',
      description TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(source_id, target_id, link_type),
      FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
    CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
  `);

  return db;
}
