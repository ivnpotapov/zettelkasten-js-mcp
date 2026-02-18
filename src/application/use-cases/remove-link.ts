/**
 * Use case: Remove a link between notes
 * Handles bidirectional link removal
 */

import { type Note, NoteFactory } from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";

/**
 * Result of link removal
 */
export interface RemoveLinkResult {
  sourceNote: Note;
  targetNote: Note | null; // null if bidirectional is false
}

/**
 * Use case for removing links between notes
 */
export class RemoveLinkUseCase {
  constructor(private readonly noteRepo: INoteRepository) {}

  /**
   * Execute the use case
   * @throws Error if source note not found
   */
  execute(
    sourceId: string,
    targetId: string,
    bidirectional: boolean = false,
  ): RemoveLinkResult {
    // Validate source note exists
    const sourceNote = this.noteRepo.get(sourceId);
    if (!sourceNote) {
      throw new Error(`Source note with ID ${sourceId} not found`);
    }

    // Remove link from source to target
    const updatedSource = NoteFactory.removeLink(sourceNote, targetId);
    this.noteRepo.update(updatedSource);

    // Handle bidirectional removal
    let updatedTarget: Note | null = null;
    if (bidirectional) {
      const targetNote = this.noteRepo.get(targetId);
      if (targetNote) {
        updatedTarget = NoteFactory.removeLink(targetNote, sourceId);
        this.noteRepo.update(updatedTarget);
      }
    }

    return {
      sourceNote: this.noteRepo.get(sourceId)!,
      targetNote: updatedTarget ? this.noteRepo.get(targetId)! : null,
    };
  }
}
