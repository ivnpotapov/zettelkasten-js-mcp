/**
 * Repository for note storage and retrieval
 * Implements dual storage approach:
 * 1. Markdown files on disk (source of truth)
 * 2. SQLite database for indexing and efficient querying
 */

import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

import { config } from "../config/index.js";
import { type DBLink, initDb } from "../models/database.js";
import type { Link, LinkType, Note, NoteType, Tag } from "../models/types.js";
import { createLogger } from "../utils/logger.js";
import { noteToMarkdown, parseNoteFromMarkdown } from "../utils/markdown.js";

const logger = createLogger("NoteRepository", config.logLevel);

export class NoteRepository {
  private notesDir: string;
  private db: Database.Database;

  constructor() {
    this.notesDir = config.getNotesDir();
    this.db = initDb();

    // Initialize by rebuilding index if needed
    this.rebuildIndexIfNeeded();
  }

  /**
   * Rebuild the database index from files if needed
   */
  private rebuildIndexIfNeeded(): void {
    // Count notes in database
    const dbCount = this.db
      .prepare("SELECT COUNT(*) as count FROM notes")
      .get() as { count: number };
    const dbNoteCount = dbCount.count;

    // Count note files
    let fileCount = 0;
    try {
      const files = fs.readdirSync(this.notesDir);
      fileCount = files.filter((f) => f.endsWith(".md")).length;
    } catch (_e) {
      logger.warning(`Could not count files in ${this.notesDir}`);
    }

    // Rebuild if counts don't match
    if (dbNoteCount !== fileCount) {
      logger.info(
        `Rebuilding index: DB has ${dbNoteCount} notes, files: ${fileCount}`,
      );
      this.rebuildIndex();
    }
  }

  /**
   * Rebuild the database index from all markdown files
   */
  rebuildIndex(): void {
    // Clear the database first
    this.db.exec("DELETE FROM links");
    this.db.exec("DELETE FROM note_tags");
    this.db.exec("DELETE FROM tags");
    this.db.exec("DELETE FROM notes");

    // Read all markdown files
    let noteFiles: string[] = [];
    try {
      const files = fs.readdirSync(this.notesDir);
      noteFiles = files.filter((f) => f.endsWith(".md"));
    } catch (e) {
      logger.error(`Failed to read notes directory: ${e}`);
      return;
    }

    // Process files in batches
    const batchSize = 100;
    for (let i = 0; i < noteFiles.length; i += batchSize) {
      const batch = noteFiles.slice(i, i + batchSize);

      for (const file of batch) {
        try {
          const filePath = path.join(this.notesDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const noteId = path.basename(file, ".md");
          const note = parseNoteFromMarkdown(content, noteId);
          this.indexNote(note);
        } catch (e) {
          logger.error(`Error processing file ${file}: ${e}`);
        }
      }
    }

    logger.info(`Rebuild complete: indexed ${noteFiles.length} notes`);
  }

  /**
   * Index a note in the database
   */
  private indexNote(note: Note): void {
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

    // Insert or update note (using ON CONFLICT to avoid cascade delete)
    const createdAt = note.createdAt.toISOString();
    const updatedAt = note.updatedAt.toISOString();
    insertNote.run(
      note.id,
      note.title,
      note.content,
      note.noteType,
      createdAt,
      updatedAt,
    );

    // Clear existing links and tags for this note only
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
   * Create a new note
   */
  create(note: Note): Note {
    // Generate ID if not present
    if (!note.id) {
      const { generateId } = require("../utils/id-generator.js");
      note.id = generateId();
    }

    // Convert note to markdown
    const markdown = noteToMarkdown(note);

    // Write to file
    const filePath = path.join(this.notesDir, `${note.id}.md`);
    try {
      fs.writeFileSync(filePath, markdown, "utf-8");
    } catch (e) {
      throw new Error(`Failed to write note to ${filePath}: ${e}`);
    }

    // Index in database
    this.indexNote(note);

    return note;
  }

  /**
   * Get a note by ID
   */
  get(id: string): Note | null {
    const filePath = path.join(this.notesDir, `${id}.md`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return parseNoteFromMarkdown(content, id);
    } catch (e) {
      throw new Error(`Failed to read note ${id}: ${e}`);
    }
  }

  /**
   * Get a note by title
   */
  getByTitle(title: string): Note | null {
    const row = this.db
      .prepare("SELECT id FROM notes WHERE title = ?")
      .get(title) as { id: string } | undefined;
    if (row) {
      return this.get(row.id);
    }
    return null;
  }

  /**
   * Get all notes
   */
  getAll(): Note[] {
    const rows = this.db.prepare("SELECT id FROM notes").all() as {
      id: string;
    }[];
    const notes: Note[] = [];

    for (const row of rows) {
      const note = this.get(row.id);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Update a note
   */
  update(note: Note): Note {
    // Check if note exists
    const existingNote = this.get(note.id);
    if (!existingNote) {
      throw new Error(`Note with ID ${note.id} does not exist`);
    }

    // Update timestamp
    note.updatedAt = new Date();

    // Convert note to markdown
    const markdown = noteToMarkdown(note);

    // Write to file
    const filePath = path.join(this.notesDir, `${note.id}.md`);
    try {
      fs.writeFileSync(filePath, markdown, "utf-8");
    } catch (e) {
      throw new Error(`Failed to write note to ${filePath}: ${e}`);
    }

    // Re-index in database
    this.indexNote(note);

    return note;
  }

  /**
   * Delete a note
   */
  delete(id: string): void {
    // Check if note exists
    const filePath = path.join(this.notesDir, `${id}.md`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Note with ID ${id} does not exist`);
    }

    // Delete from file system
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      throw new Error(`Failed to delete note ${id}: ${e}`);
    }

    // Delete from database (cascades will handle links and tags)
    this.db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  }

  /**
   * Search for notes based on criteria
   */
  search(options: {
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
  }): Note[] {
    let query = "SELECT DISTINCT n.id FROM notes n";
    const conditions: string[] = [];
    const params: any[] = [];

    // Join with links if needed
    if (options.linkedTo || options.linkedFrom) {
      query += " LEFT JOIN links l ON n.id = l.source_id OR n.id = l.target_id";
    }

    // Join with tags if needed
    if (options.tag || options.tags) {
      query +=
        " LEFT JOIN note_tags nt ON n.id = nt.note_id LEFT JOIN tags t ON nt.tag_id = t.id";
    }

    // Build conditions
    if (options.content) {
      conditions.push("(n.content LIKE ? OR n.title LIKE ?)");
      params.push(`%${options.content}%`, `%${options.content}%`);
    }

    if (options.title) {
      conditions.push("LOWER(n.title) LIKE LOWER(?)");
      params.push(`%${options.title}%`);
    }

    if (options.noteType) {
      const noteType =
        typeof options.noteType === "string"
          ? options.noteType
          : options.noteType;
      conditions.push("n.note_type = ?");
      params.push(noteType);
    }

    if (options.tag) {
      conditions.push("t.name = ?");
      params.push(options.tag);
    }

    if (options.tags && options.tags.length > 0) {
      conditions.push(`t.name IN (${options.tags.map(() => "?").join(", ")})`);
      params.push(...options.tags);
    }

    if (options.linkedTo) {
      conditions.push("(l.target_id = ? AND l.source_id = n.id)");
      params.push(options.linkedTo);
    }

    if (options.linkedFrom) {
      conditions.push("(l.source_id = ? AND l.target_id = n.id)");
      params.push(options.linkedFrom);
    }

    if (options.createdAfter) {
      conditions.push("n.created_at >= ?");
      params.push(options.createdAfter.toISOString());
    }

    if (options.createdBefore) {
      conditions.push("n.created_at <= ?");
      params.push(options.createdBefore.toISOString());
    }

    if (options.updatedAfter) {
      conditions.push("n.updated_at >= ?");
      params.push(options.updatedAfter.toISOString());
    }

    if (options.updatedBefore) {
      conditions.push("n.updated_at <= ?");
      params.push(options.updatedBefore.toISOString());
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const rows = this.db.prepare(query).all(...params) as { id: string }[];
    const notes: Note[] = [];

    for (const row of rows) {
      const note = this.get(row.id);
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
   * Find linked notes
   */
  findLinkedNotes(
    noteId: string,
    direction: "outgoing" | "incoming" | "both" = "outgoing",
  ): Note[] {
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
    const rows = this.db.prepare(query).all(...params) as { id: string }[];

    const notes: Note[] = [];
    for (const row of rows) {
      const note = this.get(row.id);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Get all tags
   */
  getAllTags(): Tag[] {
    const rows = this.db.prepare("SELECT name FROM tags").all() as {
      name: string;
    }[];
    return rows.map((row) => ({ name: row.name }));
  }

  /**
   * Get all link types for a note
   */
  getLinksForNote(noteId: string): Link[] {
    const rows = this.db
      .prepare("SELECT * FROM links WHERE source_id = ?")
      .all(noteId) as DBLink[];
    return rows.map((row) => ({
      sourceId: row.source_id,
      targetId: row.target_id,
      linkType: row.link_type as LinkType,
      description: row.description || undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get all incoming links for a note
   */
  getIncomingLinksForNote(noteId: string): Link[] {
    const rows = this.db
      .prepare("SELECT * FROM links WHERE target_id = ?")
      .all(noteId) as DBLink[];
    return rows.map((row) => ({
      sourceId: row.source_id,
      targetId: row.target_id,
      linkType: row.link_type as LinkType,
      description: row.description || undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}
