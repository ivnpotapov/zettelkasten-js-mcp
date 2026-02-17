/**
 * Service layer for Zettelkasten operations
 */

import { config } from "../config/index.js";
import {
  type CreateLinkInput,
  type CreateNoteInput,
  LinkType,
  type Note,
  NoteType,
  type Tag,
  type UpdateNoteInput,
} from "../models/types.js";
import { NoteRepository } from "../storage/note-repository.js";
import { generateId } from "../utils/id-generator.js";
import { createLogger } from "../utils/logger.js";

const _logger = createLogger("ZettelService", config.logLevel);

export class ZettelService {
  private repository: NoteRepository;

  constructor(repository?: NoteRepository) {
    this.repository = repository || new NoteRepository();
  }

  /**
   * Initialize the service and dependencies
   */
  initialize(): void {
    // Nothing to do here for synchronous implementation
    // The repository is initialized in its constructor
  }

  /**
   * Create a new note
   */
  createNote(input: CreateNoteInput): Note {
    if (!input.title) {
      throw new Error("Title is required");
    }
    if (!input.content) {
      throw new Error("Content is required");
    }

    const note: Note = {
      id: generateId(),
      title: input.title,
      content: input.content,
      noteType: input.noteType || NoteType.PERMANENT,
      tags: (input.tags || []).map((name) => ({ name })),
      links: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: input.metadata || {},
    };

    return this.repository.create(note);
  }

  /**
   * Retrieve a note by ID
   */
  getNote(noteId: string): Note | null {
    return this.repository.get(noteId);
  }

  /**
   * Retrieve a note by title
   */
  getNoteByTitle(title: string): Note | null {
    return this.repository.getByTitle(title);
  }

  /**
   * Update an existing note
   */
  updateNote(input: UpdateNoteInput): Note {
    const note = this.repository.get(input.noteId);
    if (!note) {
      throw new Error(`Note with ID ${input.noteId} not found`);
    }

    // Update fields
    if (input.title !== undefined) {
      note.title = input.title;
    }
    if (input.content !== undefined) {
      note.content = input.content;
    }
    if (input.noteType !== undefined) {
      note.noteType = input.noteType;
    }
    if (input.tags !== undefined) {
      note.tags = input.tags.map((name) => ({ name }));
    }
    if (input.metadata !== undefined) {
      note.metadata = input.metadata;
    }
    note.updatedAt = new Date();

    return this.repository.update(note);
  }

  /**
   * Delete a note
   */
  deleteNote(noteId: string): void {
    this.repository.delete(noteId);
  }

  /**
   * Get all notes
   */
  getAllNotes(): Note[] {
    return this.repository.getAll();
  }

  /**
   * Search for notes based on criteria
   */
  searchNotes(options: Parameters<NoteRepository["search"]>[0]): Note[] {
    return this.repository.search(options);
  }

  /**
   * Get notes by tag
   */
  getNotesByTag(tag: string): Note[] {
    return this.repository.findByTag(tag);
  }

  /**
   * Add a tag to a note
   */
  addTagToNote(noteId: string, tag: string): Note {
    const note = this.repository.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    // Check if tag already exists
    if (!note.tags.some((t) => t.name === tag)) {
      note.tags.push({ name: tag });
      note.updatedAt = new Date();
      return this.repository.update(note);
    }

    return note;
  }

  /**
   * Remove a tag from a note
   */
  removeTagFromNote(noteId: string, tag: string): Note {
    const note = this.repository.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    note.tags = note.tags.filter((t) => t.name !== tag);
    note.updatedAt = new Date();

    return this.repository.update(note);
  }

  /**
   * Get all tags in the system
   */
  getAllTags(): Tag[] {
    return this.repository.getAllTags();
  }

  /**
   * Create a link between notes with proper bidirectional semantics
   */
  createLink(input: CreateLinkInput): [Note, Note | null] {
    const sourceNote = this.repository.get(input.sourceId);
    if (!sourceNote) {
      throw new Error(`Source note with ID ${input.sourceId} not found`);
    }

    const targetNote = this.repository.get(input.targetId);
    if (!targetNote) {
      throw new Error(`Target note with ID ${input.targetId} not found`);
    }

    const linkType = input.linkType || LinkType.REFERENCE;

    // Check if this link already exists before attempting to add it
    const linkExists = sourceNote.links.some(
      (link) => link.targetId === input.targetId && link.linkType === linkType,
    );

    if (!linkExists) {
      sourceNote.links.push({
        sourceId: input.sourceId,
        targetId: input.targetId,
        linkType,
        description: input.description,
        createdAt: new Date(),
      });
      sourceNote.updatedAt = new Date();
      this.repository.update(sourceNote);
    }

    // If bidirectional, add link from target to source with appropriate semantics
    let reverseNote: Note | null = null;
    if (input.bidirectional) {
      const bidirectionalType = this.getInverseLinkType(linkType);

      // Check if the reverse link already exists
      const reverseLinkExists = targetNote.links.some(
        (link) =>
          link.targetId === input.sourceId &&
          link.linkType === bidirectionalType,
      );

      if (!reverseLinkExists) {
        targetNote.links.push({
          sourceId: input.targetId,
          targetId: input.sourceId,
          linkType: bidirectionalType,
          description: input.description,
          createdAt: new Date(),
        });
        targetNote.updatedAt = new Date();
        reverseNote = this.repository.update(targetNote);
      } else {
        reverseNote = targetNote;
      }
    }

    return [sourceNote, reverseNote];
  }

  /**
   * Get the inverse link type for a given link type
   */
  private getInverseLinkType(linkType: LinkType): LinkType {
    const inverseMap: Record<LinkType, LinkType> = {
      [LinkType.REFERENCE]: LinkType.REFERENCE,
      [LinkType.EXTENDS]: LinkType.EXTENDED_BY,
      [LinkType.EXTENDED_BY]: LinkType.EXTENDS,
      [LinkType.REFINES]: LinkType.REFINED_BY,
      [LinkType.REFINED_BY]: LinkType.REFINES,
      [LinkType.CONTRADICTS]: LinkType.CONTRADICTED_BY,
      [LinkType.CONTRADICTED_BY]: LinkType.CONTRADICTS,
      [LinkType.QUESTIONS]: LinkType.QUESTIONED_BY,
      [LinkType.QUESTIONED_BY]: LinkType.QUESTIONS,
      [LinkType.SUPPORTS]: LinkType.SUPPORTED_BY,
      [LinkType.SUPPORTED_BY]: LinkType.SUPPORTS,
      [LinkType.RELATED]: LinkType.RELATED,
    };
    return inverseMap[linkType] || linkType;
  }

  /**
   * Remove a link between notes
   */
  removeLink(
    sourceId: string,
    targetId: string,
    bidirectional: boolean = false,
  ): [Note, Note | null] {
    const sourceNote = this.repository.get(sourceId);
    if (!sourceNote) {
      throw new Error(`Source note with ID ${sourceId} not found`);
    }

    // Remove link from source to target
    sourceNote.links = sourceNote.links.filter(
      (link) => !(link.targetId === targetId),
    );
    sourceNote.updatedAt = new Date();
    this.repository.update(sourceNote);

    // If bidirectional, remove link from target to source
    let reverseNote: Note | null = null;
    if (bidirectional) {
      const targetNote = this.repository.get(targetId);
      if (targetNote) {
        targetNote.links = targetNote.links.filter(
          (link) => !(link.targetId === sourceId),
        );
        targetNote.updatedAt = new Date();
        reverseNote = this.repository.update(targetNote);
      }
    }

    return [sourceNote, reverseNote];
  }

  /**
   * Get notes linked to/from a note
   */
  getLinkedNotes(
    noteId: string,
    direction: "outgoing" | "incoming" | "both" = "outgoing",
  ): Note[] {
    const note = this.repository.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    return this.repository.findLinkedNotes(noteId, direction);
  }

  /**
   * Rebuild the database index from files
   */
  rebuildIndex(): void {
    this.repository.rebuildIndex();
  }

  /**
   * Export a note in the specified format
   */
  exportNote(noteId: string, format: "markdown" = "markdown"): string {
    const note = this.repository.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    if (format === "markdown") {
      const { noteToMarkdown } = require("../utils/markdown.js");
      return noteToMarkdown(note);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Find notes similar to the given note based on shared tags and links
   */
  findSimilarNotes(
    noteId: string,
    threshold: number = 0.5,
  ): Array<[Note, number]> {
    const note = this.repository.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const allNotes = this.repository.getAll();
    const results: Array<[Note, number]> = [];

    // Set of this note's tags and links
    const noteTags = new Set(note.tags.map((t) => t.name));
    const noteLinks = new Set(note.links.map((l) => l.targetId));

    // Add notes linked to this note
    const incomingNotes = this.repository.findLinkedNotes(noteId, "incoming");
    const noteIncoming = new Set(incomingNotes.map((n) => n.id));

    // For each note, calculate similarity
    for (const otherNote of allNotes) {
      if (otherNote.id === noteId) continue;

      // Calculate tag overlap
      const otherTags = new Set(otherNote.tags.map((t) => t.name));
      const tagOverlap = [...noteTags].filter((t) => otherTags.has(t)).length;

      // Calculate link overlap (outgoing)
      const otherLinks = new Set(otherNote.links.map((l) => l.targetId));
      const linkOverlap = [...noteLinks].filter((l) =>
        otherLinks.has(l),
      ).length;

      // Check if other note links to this note
      const incomingOverlap = noteIncoming.has(otherNote.id) ? 1 : 0;

      // Check if this note links to other note
      const outgoingOverlap = noteLinks.has(otherNote.id) ? 1 : 0;

      // Calculate similarity score
      // Weight: 40% tags, 20% outgoing links, 20% incoming links, 20% direct connections
      const totalPossible =
        Math.max(noteTags.size, otherTags.size) * 0.4 +
        Math.max(noteLinks.size, otherLinks.size) * 0.2 +
        1 * 0.2 + // Possible incoming link
        1 * 0.2; // Possible outgoing link

      let similarity = 0;
      if (totalPossible > 0) {
        similarity =
          (tagOverlap * 0.4 +
            linkOverlap * 0.2 +
            incomingOverlap * 0.2 +
            outgoingOverlap * 0.2) /
          totalPossible;
      }

      if (similarity >= threshold) {
        results.push([otherNote, similarity]);
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b[1] - a[1]);
    return results;
  }

  /**
   * Get the repository (for use by SearchService)
   */
  getRepository(): NoteRepository {
    return this.repository;
  }
}
