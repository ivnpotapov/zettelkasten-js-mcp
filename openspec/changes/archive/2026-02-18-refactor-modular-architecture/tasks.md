# Tasks: Refactor to Modular Architecture

## 1. Phase 1 - Create New Domain Layer

- [x] 1.1 Create `src/domain/` directory structure
- [x] 1.2 Create `src/domain/entities/` with Note, Link, Tag value objects
- [x] 1.3 Add factory methods to entities (Note.create(), Link.create())
- [x] 1.4 Create `src/domain/interfaces/repository.ts` with INoteRepository interface
- [x] 1.5 Create `src/domain/interfaces/services.ts` with IZettelService, ISearchService interfaces (if needed)
- [x] 1.6 Create `src/domain/services/link-service.ts` with bidirectional link type mapping
- [x] 1.7 Create `src/domain/services/similarity-service.ts` with similarity scoring algorithm
- [x] 1.8 Extract link type inverse logic from ZettelService to LinkService
- [x] 1.9 Extract similarity algorithm from ZettelService to SimilarityService
- [x] 1.10 Add index exports for domain layer (`src/domain/index.ts`)

## 2. Phase 1 - Create New Infrastructure Layer

- [x] 2.1 Create `src/infrastructure/persistence/` directory
- [x] 2.2 Create `src/infrastructure/persistence/interfaces/` with IMarkdownFileStore, ISqliteIndex
- [x] 2.3 Create `MarkdownFileStore` class for filesystem operations
- [x] 2.4 Create `SqliteIndex` class for database operations
- [x] 2.5 Extract filesystem logic from NoteRepository to MarkdownFileStore
- [x] 2.6 Extract database logic from NoteRepository to SqliteIndex
- [x] 2.7 Create `DualStorageNoteRepository` implementing INoteRepository
- [x] 2.8 Compose MarkdownFileStore and SqliteIndex in DualStorageNoteRepository
- [x] 2.9 Add index exports for infrastructure layer (`src/infrastructure/index.ts`)

## 3. Phase 1 - Create New Application Layer

- [x] 3.1 Create `src/application/use-cases/` directory
- [x] 3.2 Create `CreateNoteUseCase` class
- [x] 3.3 Create `GetNoteUseCase` class
- [x] 3.4 Create `UpdateNoteUseCase` class
- [x] 3.5 Create `DeleteNoteUseCase` class
- [x] 3.6 Create `CreateLinkUseCase` class
- [x] 3.7 Create `RemoveLinkUseCase` class
- [x] 3.8 Create `SearchNotesUseCase` class
- [x] 3.9 Create `GetLinkedNotesUseCase` class
- [x] 3.10 Create `FindSimilarNotesUseCase` class
- [x] 3.11 Create `FindCentralNotesUseCase` class
- [x] 3.12 Create `FindOrphanedNotesUseCase` class
- [x] 3.13 Create `ListNotesByDateUseCase` class
- [x] 3.14 Create `RebuildIndexUseCase` class
- [x] 3.15 Add index exports for application layer (`src/application/index.ts`)

## 4. Phase 2 - Wire Up and Test

- [x] 4.1 Create `src/application/factory.ts` with createApplication() function
- [x] 4.2 Wire up all dependencies in factory (constructor injection)
- [ ] 4.3 Create integration test for CreateNoteUseCase
- [ ] 4.4 Create integration test for CreateLinkUseCase with bidirectional links
- [ ] 4.5 Create integration test for SearchNotesUseCase
- [ ] 4.6 Create integration test for FindSimilarNotesUseCase
- [ ] 4.7 Verify all use cases produce identical results to old services
- [ ] 4.8 Run existing test suite against new structure (if tests exist)

## 5. Phase 3 - Update MCP Interface Layer

- [x] 5.1 Create `src/interfaces/mcp/` directory
- [x] 5.2 Create `src/interfaces/mcp/tool-handlers/` directory
- [x] 5.3 Extract zk_create_note handler to `tool-handlers/create-note.ts`
- [x] 5.4 Extract zk_get_note handler to `tool-handlers/get-note.ts`
- [x] 5.5 Extract zk_update_note handler to `tool-handlers/update-note.ts`
- [x] 5.6 Extract zk_delete_note handler to `tool-handlers/delete-note.ts`
- [x] 5.7 Extract zk_create_link handler to `tool-handlers/create-link.ts`
- [x] 5.8 Extract zk_remove_link handler to `tool-handlers/remove-link.ts`
- [x] 5.9 Extract zk_search_notes handler to `tool-handlers/search-notes.ts`
- [x] 5.10 Extract zk_get_linked_notes handler to `tool-handlers/get-linked-notes.ts`
- [x] 5.11 Extract zk_find_similar_notes handler to `tool-handlers/find-similar-notes.ts`
- [x] 5.12 Extract zk_find_central_notes handler to `tool-handlers/find-central-notes.ts`
- [x] 5.13 Extract zk_find_orphaned notes handler to `tool-handlers/find-orphaned-notes.ts`
- [x] 5.14 Extract zk_list_notes_by_date handler to `tool-handlers/list-notes-by-date.ts`
- [x] 5.15 Extract zk_get_all_tags handler to `tool-handlers/get-all-tags.ts`
- [x] 5.16 Extract zk_rebuild_index handler to `tool-handlers/rebuild-index.ts`
- [x] 5.17 Rewrite `mcp-server.ts` to register handlers from use cases
- [x] 5.18 Update server to inject use cases from factory
- [x] 5.19 Test all MCP tools produce identical responses

## 6. Phase 4 - Update Entry Point and Configuration

- [x] 6.1 Update `src/index.ts` to use new factory
- [x] 6.2 Update import paths in index file
- [x] 6.3 Verify server starts without errors
- [x] 6.4 Run manual smoke test with all MCP tools

## 7. Phase 4 - Cleanup Old Code

- [x] 7.1 Delete `src/services/zettel-service.ts`
- [x] 7.2 Delete `src/services/search-service.ts`
- [x] 7.3 Delete `src/services/index.ts`
- [x] 7.4 Delete `src/services/` directory (if empty)
- [x] 7.5 Delete `src/storage/note-repository.ts`
- [x] 7.6 Delete `src/storage/index.ts`
- [x] 7.7 Delete `src/storage/` directory (if empty)
- [x] 7.8 Move utility functions from `src/utils/` if domain-owned
- [x] 7.9 Update `src/server/index.ts` exports
- [x] 7.10 Verify no broken imports remain (run TypeScript compilation)

## 8. Final Verification

- [x] 8.1 Run `npm run build` - verify clean compilation
- [x] 8.2 Run `npm run lint` - fix any issues
- [x] 8.3 Run `npm run typecheck` - verify type safety
- [ ] 8.4 Test all MCP tools manually (or via integration suite)
- [ ] 8.5 Verify dual storage still works (Markdown files + SQLite)
- [ ] 8.6 Check zk_rebuild_index tool functions correctly
- [x] 8.7 Verify no circular dependencies exist
- [x] 8.8 Update CLAUDE.md with new architecture diagram

## 9. Documentation Updates

- [x] 9.1 Update CLAUDE.md architecture section
- [x] 9.2 Add layer dependency rules to CLAUDE.md
- [ ] 9.3 Document new directory structure in README (if applicable)
- [x] 9.4 Update any inline code comments referencing old structure
