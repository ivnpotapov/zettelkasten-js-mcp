/**
 * Use case: Find orphaned notes (no connections)
 * Identifies disconnected notes in the knowledge network
 */

import type { Note } from "../../domain/entities/note/index.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Use case for finding orphaned notes
 */
export class FindOrphanedNotesUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   */
  execute(): Note[] {
    const allNotes = this.noteRepo.getAll();
    const orphans: Note[] = [];

    for (const note of allNotes) {
      const outgoingLinks = this.noteRepo.getLinksForNote(note.id);
      const incomingLinks = this.noteRepo.getIncomingLinksForNote(note.id);

      if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
        orphans.push(note);
      }
    }

    return orphans;
  }
}
