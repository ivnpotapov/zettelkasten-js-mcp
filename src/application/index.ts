/**
 * Application layer - use cases and orchestration
 */

export {
  type CreateLinkInput,
  CreateLinkUseCase,
  type LinkResult,
} from "./use-cases/create-link.js";
// Use Cases
export {
  type CreateNoteInput,
  CreateNoteUseCase,
} from "./use-cases/create-note.js";
export { DeleteNoteUseCase } from "./use-cases/delete-note.js";
export {
  type CentralNoteResult,
  FindCentralNotesUseCase,
} from "./use-cases/find-central-notes.js";
export { FindOrphanedNotesUseCase } from "./use-cases/find-orphaned-notes.js";
export {
  FindSimilarNotesUseCase,
  type SimilarityResult,
} from "./use-cases/find-similar-notes.js";
export { GetLinkedNotesUseCase } from "./use-cases/get-linked-notes.js";
export { GetNoteUseCase } from "./use-cases/get-note.js";
export { ListNotesByDateUseCase } from "./use-cases/list-notes-by-date.js";
export {
  type RebuildIndexResult,
  RebuildIndexUseCase,
} from "./use-cases/rebuild-index.js";
export {
  type RemoveLinkResult,
  RemoveLinkUseCase,
} from "./use-cases/remove-link.js";
export {
  type SearchInput,
  SearchNotesUseCase,
} from "./use-cases/search-notes.js";
export {
  type UpdateNoteInput,
  UpdateNoteUseCase,
} from "./use-cases/update-note.js";
