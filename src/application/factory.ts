/**
 * Application factory - creates and wires up all dependencies
 * Implements dependency injection for clean architecture
 */

import Database from "better-sqlite3";

import { config } from "../config/index.js";
import { LinkService, SimilarityService } from "../domain/index.js";
import {
  DualStorageNoteRepository,
  MarkdownFileStore,
  SqliteIndex,
} from "../infrastructure/index.js";
import { getDatabasePath } from "../utils/path/get-database-path.js";
import { getNotesDir } from "../utils/path/get-notes-dir.js";
import {
  CreateLinkUseCase,
  CreateNoteUseCase,
  DeleteNoteUseCase,
  FindCentralNotesUseCase,
  FindOrphanedNotesUseCase,
  FindSimilarNotesUseCase,
  GetLinkedNotesUseCase,
  GetNoteUseCase,
  ListNotesByDateUseCase,
  RebuildIndexUseCase,
  RemoveLinkUseCase,
  SearchNotesUseCase,
  UpdateNoteUseCase,
} from "./index.js";

/**
 * Application container with all use cases
 */
export type Application = {
  // Note operations
  createNote: CreateNoteUseCase;
  getNote: GetNoteUseCase;
  updateNote: UpdateNoteUseCase;
  deleteNote: DeleteNoteUseCase;

  // Link operations
  createLink: CreateLinkUseCase;
  removeLink: RemoveLinkUseCase;
  getLinkedNotes: GetLinkedNotesUseCase;

  // Search operations
  searchNotes: SearchNotesUseCase;
  findSimilarNotes: FindSimilarNotesUseCase;
  findCentralNotes: FindCentralNotesUseCase;
  findOrphanedNotes: FindOrphanedNotesUseCase;
  listNotesByDate: ListNotesByDateUseCase;

  // System operations
  rebuildIndex: RebuildIndexUseCase;

  // Cleanup
  shutdown: () => void;
};

/**
 * Create the application with all dependencies wired up
 */
export function createApplication(): Application {
  // Initialize infrastructure
  const db = new Database(getDatabasePath(config.databasePath));
  const notesDir = getNotesDir(config.notesDir);

  const fileStore = new MarkdownFileStore({ notesDirectory: notesDir });
  const sqliteIndex = new SqliteIndex({ db });
  const noteRepository = new DualStorageNoteRepository(fileStore, sqliteIndex);

  // Initialize domain services
  const linkService = new LinkService();
  const similarityService = new SimilarityService();

  // Initialize use cases
  const createNote = new CreateNoteUseCase(noteRepository);
  const getNote = new GetNoteUseCase(noteRepository);
  const updateNote = new UpdateNoteUseCase(noteRepository);
  const deleteNote = new DeleteNoteUseCase(noteRepository);
  const createLink = new CreateLinkUseCase(noteRepository, linkService);
  const removeLink = new RemoveLinkUseCase(noteRepository);
  const searchNotes = new SearchNotesUseCase(noteRepository);
  const getLinkedNotes = new GetLinkedNotesUseCase(noteRepository);
  const findSimilarNotes = new FindSimilarNotesUseCase(
    noteRepository,
    similarityService,
  );
  const findCentralNotes = new FindCentralNotesUseCase(noteRepository);
  const findOrphanedNotes = new FindOrphanedNotesUseCase(noteRepository);
  const listNotesByDate = new ListNotesByDateUseCase(noteRepository);
  const rebuildIndex = new RebuildIndexUseCase(noteRepository);

  return {
    // Note operations
    createNote,
    getNote,
    updateNote,
    deleteNote,

    // Link operations
    createLink,
    removeLink,
    getLinkedNotes,

    // Search operations
    searchNotes,
    findSimilarNotes,
    findCentralNotes,
    findOrphanedNotes,
    listNotesByDate,

    // System operations
    rebuildIndex,

    // Cleanup
    shutdown: () => {
      noteRepository.close();
    },
  };
}
