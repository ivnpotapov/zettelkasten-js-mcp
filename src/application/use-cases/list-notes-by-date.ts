/**
 * Use case: List notes within a date range
 * Supports filtering by created_at or updated_at
 */

import type { Note } from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Use case for finding notes by date range
 */
export class ListNotesByDateUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @param startDate Optional start date (inclusive)
   * @param endDate Optional end date (inclusive)
   * @param useUpdated If true, use updated_at instead of created_at
   */
  execute(
    startDate: Date | null = null,
    endDate: Date | null = null,
    useUpdated: boolean = false,
  ): Note[] {
    const allNotes = this.noteRepo.getAll();
    const matchingNotes: Note[] = [];

    for (const note of allNotes) {
      const date = useUpdated ? note.updatedAt : note.createdAt;

      // Check if in range
      if (startDate && date < startDate) {
        continue;
      }
      if (endDate && date > endDate) {
        continue;
      }

      matchingNotes.push(note);
    }

    // Sort by date (descending)
    matchingNotes.sort((a, b) => {
      const aDate = useUpdated ? a.updatedAt : a.createdAt;
      const bDate = useUpdated ? b.updatedAt : b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    return matchingNotes;
  }
}
