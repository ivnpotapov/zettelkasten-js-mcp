/**
 * Use case: Find notes similar to a given note
 * Uses domain SimilarityService for scoring
 */

import type { Note } from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";
import type { SimilarityService } from "../../domain/services/similarity-service.js";

/**
 * Similarity result with note and score
 */
export interface SimilarityResult {
  note: Note;
  score: number;
}

/**
 * Use case for finding similar notes
 */
export class FindSimilarNotesUseCase {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly similarityService: SimilarityService,
  ) {}

  /**
   * Execute the use case
   * @throws Error if note not found
   */
  execute(noteId: string, threshold: number = 0.3): SimilarityResult[] {
    // Validate note exists
    const baseNote = this.noteRepo.get(noteId);
    if (!baseNote) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    // Get all notes for comparison
    const allNotes = this.noteRepo.getAll();

    // Use similarity service to find matches
    const results = this.similarityService.findSimilarNotes(
      baseNote,
      allNotes,
      threshold,
    );

    return results;
  }
}
