/**
 * Markdown file storage module
 *
 * Provides filesystem-based storage for Zettelkasten notes as Markdown files.
 *
 * @module infrastructure/persistence/markdown-file-store
 */

export { MarkdownFileStore } from "./markdown-file-store.js";
export type {
  IMarkdownFileStore,
  MarkdownFileStoreConfig,
} from "./types.js";
