/**
 * Infrastructure layer - external concerns (SQLite, filesystem)
 */

export { DualStorageNoteRepository } from "./persistence/dual-storage-note-repository.js";
// Markdown file storage
export {
  type IMarkdownFileStore,
  MarkdownFileStore,
  type MarkdownFileStoreConfig,
} from "./persistence/markdown-file-store/index.js";
// SQLite database initialization
export { initSqliteDatabase } from "./persistence/sqlite-database-init.js";
// SQLite index
export {
  type ISqliteIndex,
  SqliteIndex,
  type SqliteIndexConfig,
} from "./persistence/sqlite-index/index.js";
