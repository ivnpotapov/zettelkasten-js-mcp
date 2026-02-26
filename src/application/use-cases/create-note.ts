/**
 * Use case: Create a new note
 * Orchestrates domain and infrastructure to create notes with validation
 */

import {
  createNote,
  type Note,
  type NoteType,
} from "../../domain/entities/note/index.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Input for creating a note
 */
export type CreateNoteInput = {
  title: string;
  content: string;
  noteType?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

/**
 * Use case for creating Zettelkasten notes
 */
export class CreateNoteUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @throws Error if validation fails
   */
  execute(input: CreateNoteInput): Note {
    // Convert string to NoteType if provided
    const noteTypeEnum = input.noteType
      ? (input.noteType as NoteType)
      : undefined;

    // Use factory to create note with validation
    const note = createNote({
      title: input.title,
      content: input.content,
      noteType: noteTypeEnum,
      tags: input.tags,
      metadata: input.metadata,
    });

    // Persist via repository
    return this.noteRepo.create(note);
  }
}
