/**
 * Domain entity types for Zettelkasten notes
 */

// Re-export common types from models for convenience
export { LinkType, NoteType } from "../../../models/note/types.js";
export {
  isValidLinkType,
  isValidNoteType,
} from "../../../utils/type-guards.js";
export * from "./types.js";
