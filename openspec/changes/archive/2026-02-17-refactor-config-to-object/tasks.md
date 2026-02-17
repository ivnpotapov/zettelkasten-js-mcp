# Tasks: Refactor Config to Object

## 1. Create Path Utilities

- [x] 1.1 Create directory `src/utils/path/`
- [x] 1.2 Create `src/utils/path/get-absolute-path.ts` with `getAbsolutePath()` function
- [x] 1.3 Create `src/utils/path/get-notes-dir.ts` with `getNotesDir()` function (includes directory creation)
- [x] 1.4 Create `src/utils/path/get-database-path.ts` with `getDatabasePath()` function (includes directory creation)
- [x] 1.5 Create `src/utils/path/get-db-url.ts` with `getDbUrl()` function
- [x] 1.6 Create `src/utils/path/index.ts` to export all path utilities

## 2. Create Plain Config Object

- [x] 2.1 Create new `src/config/index.ts` with plain config object
- [x] 2.2 Verify all environment variables are properly loaded
- [x] 2.3 Verify package.json import works for server name and version

## 3. Update Imports

- [x] 3.1 Update `src/storage/note-repository.ts` to use new utilities
- [x] 3.2 Update `src/services/zettel-service.ts` to use new utilities (no changes needed)
- [x] 3.3 Update `src/services/search-service.ts` to use new utilities (no changes needed)
- [x] 3.4 Update `src/server/mcp-server.ts` to use new utilities (no changes needed)
- [x] 3.5 Update `src/models/database.ts` to use new utilities
- [x] 3.6 Update `src/utils/logger.ts` to use new utilities (no changes needed)

## 4. Cleanup

- [x] 4.1 Delete `src/config/config-class.ts`
- [x] 4.2 Run TypeScript compiler: `npm run typecheck`
- [x] 4.3 Run linter: `npm run lint`
- [x] 4.4 Build project: `npm run build`
- [x] 4.5 Test server startup: `npm start`

## 5. Archive Change

- [x] 5.1 Run `/opsx:archive refactor-config-to-object`
- [x] 5.2 Verify change moved to `openspec/changes/archive/`

## 6. Commit Changes

- [x] 6.1 Stage changes: `git add .`
- [x] 6.2 Commit: `git commit -m "refactor: convert ZettelkastenConfig to plain object and extract utilities"`
- [ ] 6.3 Push to remote (if applicable)
