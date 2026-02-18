/**
 * Use case: Update an existing note
 * Handles partial updates with automatic timestamp management
 */

import {
  addTagToNote,
  type Note,
  type NoteType,
  removeTagFromNote,
} from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Input for updating a note
 */
export interface UpdateNoteInput {
  noteId: string;
  title?: string;
  content?: string;
  noteType?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Use case for updating Zettelkasten notes
 */
export class UpdateNoteUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @throws Error if note not found
   */
  execute(input: UpdateNoteInput): Note {
    // Get existing note
    const existing = this.noteRepo.get(input.noteId);
    if (!existing) {
      throw new Error(`Note with ID ${input.noteId} not found`);
    }

    // Apply updates
    const updated: Note = {
      ...existing,
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updated.title = input.title;
    }
    if (input.content !== undefined) {
      updated.content = input.content;
    }
    if (input.noteType !== undefined) {
      updated.noteType = input.noteType as NoteType;
    }
    if (input.tags !== undefined) {
      updated.tags = input.tags.map((name) => ({ name }));
    }
    if (input.metadata !== undefined) {
      updated.metadata = input.metadata;
    }

    // Persist via repository
    return this.noteRepo.update(updated);
  }

  /**
   * Add a tag to a note
   */
  addTag(noteId: string, tagName: string): Note {
    const note = this.noteRepo.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const updated = addTagToNote(note, tagName);
    return this.noteRepo.update(updated);
  }

  /**
   * Remove a tag from a note
   */
  removeTag(noteId: string, tagName: string): Note {
    const note = this.noteRepo.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const updated = removeTagFromNote(note, tagName);
    return this.noteRepo.update(updated);
  }
}
