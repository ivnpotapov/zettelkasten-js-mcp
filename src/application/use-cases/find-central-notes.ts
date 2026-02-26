/**
 * Use case: Find the most connected notes (hub notes)
 * Identifies central notes in the knowledge network
 */

import type { Note } from "../../domain/entities/note/index.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Central note result with connection count
 */
export type CentralNoteResult = {
  note: Note;
  connections: number;
};

/**
 * Use case for finding central notes
 */
export class FindCentralNotesUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   */
  execute(limit: number = 10): CentralNoteResult[] {
    const allNotes = this.noteRepo.getAll();
    const results: CentralNoteResult[] = [];

    for (const note of allNotes) {
      const outgoingLinks = this.noteRepo.getLinksForNote(note.id);
      const incomingLinks = this.noteRepo.getIncomingLinksForNote(note.id);

      const totalConnections = outgoingLinks.length + incomingLinks.length;

      if (totalConnections > 0) {
        results.push({ note, connections: totalConnections });
      }
    }

    // Sort by connections (descending)
    results.sort((a, b) => b.connections - a.connections);

    // Return top N
    return results.slice(0, limit);
  }
}
