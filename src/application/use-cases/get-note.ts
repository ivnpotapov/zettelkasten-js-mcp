/**
 * Use case: Retrieve a note
 * Supports retrieval by ID or title
 */

import type { Note } from "../../domain/entities/note/index.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Use case for retrieving Zettelkasten notes
 */
export class GetNoteUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Get a note by ID
   */
  byId(id: string): Note | null {
    return this.noteRepo.get(id);
  }

  /**
   * Get a note by title
   */
  byTitle(title: string): Note | null {
    return this.noteRepo.getByTitle(title);
  }

  /**
   * Get a note by ID or title (tries ID first, then title)
   */
  byIdOrTitle(identifier: string): Note | null {
    // Try ID first
    const note = this.noteRepo.get(identifier);
    if (note) {
      return note;
    }

    // Fall back to title
    return this.noteRepo.getByTitle(identifier);
  }

  /**
   * Get all notes
   */
  all(): Note[] {
    return this.noteRepo.getAll();
  }
}
