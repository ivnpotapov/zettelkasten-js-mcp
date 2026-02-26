/**
 * Type guard utilities for Zettelkasten types
 *
 * Provides runtime type checking functions for note and link types.
 *
 * @module utils/type-guards
 */

import { LINK_TYPE, NOTE_TYPE } from "../models/note/constants.js";
import type { LinkType, NoteType } from "../models/note/types.js";

/**
 * Check if a string value is a valid NoteType
 */
export function isValidNoteType(value: string): value is NoteType {
  return Object.values(NOTE_TYPE).includes(value as NoteType);
}

/**
 * Check if a string value is a valid LinkType
 */
export function isValidLinkType(value: string): value is LinkType {
  return Object.values(LINK_TYPE).includes(value as LinkType);
}
