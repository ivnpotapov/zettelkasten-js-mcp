/**
 * Common note and link types used across multiple layers
 *
 * @module models/note/types
 */

/**
 * Types of notes in a Zettelkasten
 */
export type NoteType =
  | "fleeting"
  | "literature"
  | "permanent"
  | "structure"
  | "hub";

/**
 * Types of links between notes
 */
export type LinkType =
  | "reference"
  | "extends"
  | "extended_by"
  | "refines"
  | "refined_by"
  | "contradicts"
  | "contradicted_by"
  | "questions"
  | "questioned_by"
  | "supports"
  | "supported_by"
  | "related";

/**
 * Type for the NOTE_TYPE constant object
 */
export type NoteTypeConst = {
  readonly FLEETING: NoteType;
  readonly LITERATURE: NoteType;
  readonly PERMANENT: NoteType;
  readonly STRUCTURE: NoteType;
  readonly HUB: NoteType;
};

/**
 * Type for the LINK_TYPE constant object
 */
export type LinkTypeConst = {
  readonly REFERENCE: LinkType;
  readonly EXTENDS: LinkType;
  readonly EXTENDED_BY: LinkType;
  readonly REFINES: LinkType;
  readonly REFINED_BY: LinkType;
  readonly CONTRADICTS: LinkType;
  readonly CONTRADICTED_BY: LinkType;
  readonly QUESTIONS: LinkType;
  readonly QUESTIONED_BY: LinkType;
  readonly SUPPORTS: LinkType;
  readonly SUPPORTED_BY: LinkType;
  readonly RELATED: LinkType;
};
