/**
 * Constants for note and link types
 *
 * Provides constant objects for working with note types and link types.
 * The type definitions are in types.ts.
 *
 * @module models/note/constants
 */

import type { LinkTypeConst, NoteTypeConst } from "./types.js";

/**
 * Note type constants
 */
export const NOTE_TYPE: NoteTypeConst = {
  FLEETING: "fleeting",
  LITERATURE: "literature",
  PERMANENT: "permanent",
  STRUCTURE: "structure",
  HUB: "hub",
} as const;

/**
 * Link type constants
 */
export const LINK_TYPE: LinkTypeConst = {
  REFERENCE: "reference",
  EXTENDS: "extends",
  EXTENDED_BY: "extended_by",
  REFINES: "refines",
  REFINED_BY: "refined_by",
  CONTRADICTS: "contradicts",
  CONTRADICTED_BY: "contradicted_by",
  QUESTIONS: "questions",
  QUESTIONED_BY: "questioned_by",
  SUPPORTS: "supports",
  SUPPORTED_BY: "supported_by",
  RELATED: "related",
} as const;
