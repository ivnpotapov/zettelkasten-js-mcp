/**
 * Infrastructure layer - external concerns (SQLite, filesystem)
 */

export { DualStorageNoteRepository } from "./persistence/dual-storage-note-repository.js";
// Persistence interfaces
export type {
  IMarkdownFileStore,
  ISqliteIndex,
} from "./persistence/interfaces/file-store.js";
// Persistence implementations
export {
  MarkdownFileStore,
  type MarkdownFileStoreConfig,
} from "./persistence/markdown-file-store.js";
export {
  SqliteIndex,
  type SqliteIndexConfig,
} from "./persistence/sqlite-index.js";
