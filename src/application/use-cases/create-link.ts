/**
 * Use case: Create a link between notes
 * Handles bidirectional link creation with inverse type mapping
 */

import {
  LinkType,
  type Note,
  NoteFactory,
} from "../../domain/entities/note.js";
import type { INoteRepository } from "../../domain/interfaces/repository.js";
import type { LinkService } from "../../domain/services/link-service.js";

/**
 * Input for creating a link
 */
export interface CreateLinkInput {
  sourceId: string;
  targetId: string;
  linkType?: string;
  description?: string;
  bidirectional?: boolean;
}

/**
 * Result of link creation
 */
export interface LinkResult {
  sourceNote: Note;
  targetNote: Note | null; // null if bidirectional is false
}

/**
 * Use case for creating links between notes
 */
export class CreateLinkUseCase {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly linkService: LinkService,
  ) {}

  /**
   * Execute the use case
   * @throws Error if validation fails
   */
  execute(input: CreateLinkInput): LinkResult {
    // Validate source note exists
    const sourceNote = this.noteRepo.get(input.sourceId);
    if (!sourceNote) {
      throw new Error(`Source note with ID ${input.sourceId} not found`);
    }

    // Validate target note exists
    const targetNote = this.noteRepo.get(input.targetId);
    if (!targetNote) {
      throw new Error(`Target note with ID ${input.targetId} not found`);
    }

    // Parse link type
    const linkType = (input.linkType as LinkType) ?? LinkType.REFERENCE;

    // Validate link type
    if (!this.linkService.isValidLinkType(linkType)) {
      throw new Error(`Invalid link type: ${linkType}`);
    }

    // Check for duplicate link
    const linkExists = sourceNote.links.some(
      (l) => l.targetId === input.targetId && l.linkType === linkType,
    );

    if (!linkExists) {
      // Create and add link to source note
      const link = NoteFactory.createLink({
        sourceId: input.sourceId,
        targetId: input.targetId,
        linkType,
        description: input.description,
      });

      const updatedSource = NoteFactory.addLink(sourceNote, link);
      this.noteRepo.update(updatedSource);
    }

    // Handle bidirectional links
    let updatedTarget: Note | null = null;
    if (input.bidirectional) {
      const inverseType = this.linkService.getInverseLinkType(linkType);

      // Check if reverse link already exists
      const reverseLinkExists = targetNote.links.some(
        (l) => l.targetId === input.sourceId && l.linkType === inverseType,
      );

      if (!reverseLinkExists) {
        const reverseLink = NoteFactory.createLink({
          sourceId: input.targetId,
          targetId: input.sourceId,
          linkType: inverseType,
          description: input.description,
        });

        updatedTarget = NoteFactory.addLink(targetNote, reverseLink);
        this.noteRepo.update(updatedTarget);
      } else {
        updatedTarget = targetNote;
      }
    }

    return {
      sourceNote: this.noteRepo.get(input.sourceId)!,
      targetNote: updatedTarget ? this.noteRepo.get(input.targetId)! : null,
    };
  }
}
