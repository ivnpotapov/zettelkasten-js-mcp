/**
 * Database models and initialization for better-sqlite3
 */

import Database from "better-sqlite3";

import { config } from "../config/index.js";
import { LinkType, NoteType } from "./types.js";

/**
 * Initialize the database and create tables if they don't exist
 */
export function initDb(): Database.Database {
  const dbPath = config.getDatabasePath();
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create notes table
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Create note_tags association table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Create links table
  db.exec(`
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

/**
 * DBNote interface for database records
 */
export interface DBNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * DBTag interface for database records
 */
export interface DBTag {
  id: number;
  name: string;
}

/**
 * DBLink interface for database records
 */
export interface DBLink {
  id: number;
  source_id: string;
  target_id: string;
  link_type: string;
  description: string | null;
  created_at: string;
}

/**
 * Note with tags and links from database
 */
export interface DBNoteWithRelations extends DBNote {
  tags: DBTag[];
  outgoingLinks: DBLink[];
  incomingLinks: DBLink[];
}
