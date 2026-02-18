/**
 * Filesystem-based Markdown note storage implementation
 * Handles reading and writing notes as individual .md files with YAML frontmatter
 */

import fs from "node:fs";
import path from "node:path";
import type { Note } from "../../domain/entities/note.js";
import { createLogger } from "../../utils/logger.js";
import { noteToMarkdown, parseNoteFromMarkdown } from "../../utils/markdown.js";
import type { IMarkdownFileStore } from "./interfaces/file-store.js";

const logger = createLogger(
  "MarkdownFileStore",
  process.env.ZETTELKASTEN_LOG_LEVEL ?? "INFO",
);

/**
 * Configuration for MarkdownFileStore
 */
export interface MarkdownFileStoreConfig {
  notesDirectory: string;
}

/**
 * Filesystem-based storage for Zettelkasten notes as Markdown files
 */
export class MarkdownFileStore implements IMarkdownFileStore {
  private readonly notesDir: string;

  constructor(config: MarkdownFileStoreConfig) {
    this.notesDir = config.notesDirectory;
    this.ensureDirectoryExists();
  }

  /**
   * Ensure the notes directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.notesDir)) {
      logger.info(`Creating notes directory: ${this.notesDir}`);
      fs.mkdirSync(this.notesDir, { recursive: true });
    }
  }

  /**
   * Get the file path for a note ID
   */
  private getFilePath(id: string): string {
    return path.join(this.notesDir, `${id}.md`);
  }

  /**
   * Write a note to a markdown file
   */
  write(note: Note): void {
    const filePath = this.getFilePath(note.id);
    const markdown = noteToMarkdown(note);

    try {
      fs.writeFileSync(filePath, markdown, "utf-8");
      logger.debug(`Wrote note to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write note to ${filePath}: ${error}`);
    }
  }

  /**
   * Read a note from a markdown file by ID
   */
  read(id: string): Note | null {
    const filePath = this.getFilePath(id);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return parseNoteFromMarkdown(content, id);
    } catch (error) {
      throw new Error(`Failed to read note from ${filePath}: ${error}`);
    }
  }

  /**
   * Delete a note's markdown file
   */
  delete(id: string): void {
    const filePath = this.getFilePath(id);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Note file does not exist: ${filePath}`);
    }

    try {
      fs.unlinkSync(filePath);
      logger.debug(`Deleted note file: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to delete note file ${filePath}: ${error}`);
    }
  }

  /**
   * Check if a note file exists
   */
  exists(id: string): boolean {
    const filePath = this.getFilePath(id);
    return fs.existsSync(filePath);
  }

  /**
   * List all note IDs (files) in the store
   */
  listIds(): string[] {
    try {
      const files = fs.readdirSync(this.notesDir);
      return files
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.basename(f, ".md"));
    } catch (error) {
      logger.error(`Failed to list notes in ${this.notesDir}: ${error}`);
      return [];
    }
  }
}
