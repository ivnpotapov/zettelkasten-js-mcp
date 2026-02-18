/**
 * Use case: Rebuild the database index from markdown files
 * Re-indexes all notes from filesystem to database
 */

import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Rebuild index result
 */
export interface RebuildIndexResult {
  notesProcessed: number;
  message: string;
}

/**
 * Use case for rebuilding the note index
 */
export class RebuildIndexUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   */
  execute(): RebuildIndexResult {
    const countBefore = this.noteRepo.getAll().length;

    this.noteRepo.rebuildIndex();

    const countAfter = this.noteRepo.getAll().length;
    const change = countAfter - countBefore;

    return {
      notesProcessed: countAfter,
      message: `Database index rebuilt successfully.\nNotes processed: ${countAfter}\nChange in note count: ${change}`,
    };
  }
}
