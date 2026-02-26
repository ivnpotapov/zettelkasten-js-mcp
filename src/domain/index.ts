/**
 * Domain layer - pure business logic with zero infrastructure dependencies
 */

// Re-export common types from models for convenience
export { LinkType, NoteType } from "../models/note/types.js";
// Re-export type guards from utils
export { isValidLinkType, isValidNoteType } from "../utils/type-guards.js";
// Entities
export * from "./entities/note/index.js";

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
