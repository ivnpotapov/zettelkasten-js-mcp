/**
 * Domain layer - pure business logic with zero infrastructure dependencies
 */

// Entities
export {
  addLinkToNote,
  addTagToNote,
  createLink as createNoteLink,
  createNote,
  type Link,
  type LinkType,
  type Note,
  NoteType,
  removeLinkFromNote,
  removeTagFromNote,
  type Tag,
} from "./entities/note.js";

// Interfaces
export type {
  INoteRepository,
  SearchOptions,
} from "./interfaces/repository.js";

// Domain Services
export { LinkService } from "./services/link-service.js";
export {
  type SimilarityResult,
  SimilarityService,
} from "./services/similarity-service.js";
