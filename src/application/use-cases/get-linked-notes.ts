/**
 * Use case: Get notes linked to/from a note
 * Handles directional link traversal
 */

import type { Note } from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Use case for retrieving linked notes
 */
export class GetLinkedNotesUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @throws Error if note not found
   */
  execute(
    noteId: string,
    direction: "outgoing" | "incoming" | "both" = "both",
  ): Note[] {
    // Validate note exists
    const note = this.noteRepo.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    return this.noteRepo.findLinkedNotes(noteId, direction);
  }
}
