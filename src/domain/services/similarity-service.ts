/**
 * Domain service for note similarity scoring
 * Implements the similarity algorithm based on shared tags, links, and connections
 */

import type { Note } from "../entities/note/index.js";

/**
 * Similarity calculation result
 */
export type SimilarityResult = {
  note: Note;
  score: number;
};

/**
 * Domain service for calculating note similarity
 */
export class SimilarityService {
  /**
   * Find notes similar to a given note
   * @param baseNote The reference note
   * @param allNotes All notes in the system to compare against
   * @param threshold Minimum similarity score (0.0 - 1.0)
   * @returns Array of notes with their similarity scores, sorted descending
   */
  findSimilarNotes(
    baseNote: Note,
    allNotes: Note[],
    threshold: number = 0.5,
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    // Set of base note's tags and links
    const baseTags = new Set(baseNote.tags.map((t) => t.name));
    const baseLinks = new Set(baseNote.links.map((l) => l.targetId));

    // Collect incoming links (notes that link to base note)
    const incomingNoteIds = new Set<string>();
    for (const otherNote of allNotes) {
      if (otherNote.id === baseNote.id) continue;
      for (const link of otherNote.links) {
        if (link.targetId === baseNote.id) {
          incomingNoteIds.add(otherNote.id);
        }
      }
    }

    // Calculate similarity for each note
    for (const otherNote of allNotes) {
      if (otherNote.id === baseNote.id) continue;

      const score = this.calculateSimilarity(
        otherNote,
        baseTags,
        baseLinks,
        incomingNoteIds,
      );

      if (score >= threshold) {
        results.push({ note: otherNote, score });
      }
    }

    // Sort by similarity score (descending)
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Calculate similarity score between two notes
   * Weight: 40% tags, 20% outgoing links, 20% incoming links, 20% direct connections
   */
  private calculateSimilarity(
    otherNote: Note,
    baseTags: Set<string>,
    baseLinks: Set<string>,
    incomingNoteIds: Set<string>,
  ): number {
    // Calculate tag overlap
    const otherTags = new Set(otherNote.tags.map((t) => t.name));
    const tagOverlap = this.countOverlap(baseTags, otherTags);

    // Calculate link overlap (outgoing)
    const otherLinks = new Set(otherNote.links.map((l) => l.targetId));
    const linkOverlap = this.countOverlap(baseLinks, otherLinks);

    // Check if other note links to this note
    const incomingOverlap = incomingNoteIds.has(otherNote.id) ? 1 : 0;

    // Check if this note links to other note
    const outgoingOverlap = baseLinks.has(otherNote.id) ? 1 : 0;

    // Calculate total possible score
    const totalPossible =
      Math.max(baseTags.size, otherTags.size) * 0.4 +
      Math.max(baseLinks.size, otherLinks.size) * 0.2 +
      1 * 0.2 + // Possible incoming link
      1 * 0.2; // Possible outgoing link

    if (totalPossible === 0) {
      return 0;
    }

    // Calculate weighted similarity
    return (
      (tagOverlap * 0.4 +
        linkOverlap * 0.2 +
        incomingOverlap * 0.2 +
        outgoingOverlap * 0.2) /
      totalPossible
    );
  }

  /**
   * Count overlap between two sets
   */
  private countOverlap(set1: Set<string>, set2: Set<string>): number {
    let count = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        count++;
      }
    }
    return count;
  }
}
