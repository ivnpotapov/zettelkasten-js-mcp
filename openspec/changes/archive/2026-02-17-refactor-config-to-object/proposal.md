## Why

The `ZettelkastenConfig` class mixes configuration data with utility functions for path resolution and directory management. This creates unnecessary coupling and makes the code harder to test and maintain. Extracting utilities into separate, purpose-organized modules will improve code organization and maintainability.

## What Changes

- Convert `ZettelkastenConfig` from a class to a plain configuration object
- Extract `getAbsolutePath()` to `src/utils/path/get-absolute-path.ts`
- Extract `getNotesDir()` to `src/utils/path/get-notes-dir.ts`
- Extract `getDatabasePath()` to `src/utils/path/get-database-path.ts`
- Extract `getDbUrl()` to `src/utils/path/get-db-url.ts`
- Create utility functions with proper directory creation side effects
- Update all imports that use `config` to use the new utilities
- **Naming convention:** Files named after functions in kebab-case (e.g., `getAbsolutePath()` → `get-absolute-path.ts`)

## Capabilities

### New Capabilities

None - this is a pure internal refactoring with no behavioral changes.

### Modified Capabilities

None - refactoring does not change any requirements or external behavior.

## Impact

**Affected code:**
- `src/config/config-class.ts` → `src/config/index.ts` (plain object)
- New utility files in `src/utils/path/` directory
- All files importing `config` will need updates:
  - `src/server/mcp-server.ts`
  - `src/services/zettel-service.ts`
  - `src/services/search-service.ts`
  - `src/storage/note-repository.ts`
  - `src/utils/logger.ts`

**No external impact:**
- MCP tools behavior unchanged
- API behavior unchanged
- Environment variables unchanged
