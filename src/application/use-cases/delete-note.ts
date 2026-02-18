/**
 * Use case: Delete a note
 * Removes note from both filesystem and index
 */

import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Use case for deleting Zettelkasten notes
 */
export class DeleteNoteUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @throws Error if note not found
   */
  execute(noteId: string): void {
    // Verify note exists
    const note = this.noteRepo.get(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    // Delete via repository
    this.noteRepo.delete(noteId);
  }
}
