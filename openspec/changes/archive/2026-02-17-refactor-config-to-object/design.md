# Design: Refactor Config to Object

## Context

Currently, `ZettelkastenConfig` is a class that mixes:
1. Configuration values (from env vars and package.json)
2. Path resolution utilities (`getAbsolutePath`)
3. File system operations (directory creation in `getNotesDir`, `getDatabasePath`)

This creates unnecessary complexity and makes testing harder. The config is imported by 5 files:
- `src/server/mcp-server.ts`
- `src/services/zettel-service.ts`
- `src/services/search-service.ts`
- `src/storage/note-repository.ts`
- `src/models/database.ts`

## Goals / Non-Goals

**Goals:**
- Separate configuration data from utility functions
- Organize utilities by purpose in dedicated folders
- Maintain identical external behavior (no breaking changes)
- Keep environment variable configuration working

**Non-Goals:**
- Changing configuration structure or environment variables
- Modifying external API behavior
- Performance optimizations

## Decisions

### 1. Plain Config Object
Convert `ZettelkastenConfig` class to a plain object with readonly properties.

**Rationale:** Config is data, not behavior. A plain object is simpler, has no `this` context issues, and is easier to mock in tests.

**Structure:**
```typescript
// src/config/index.ts
export const config = {
  notesDir: process.env.ZETTELKASTEN_NOTES_DIR || "data/notes",
  databasePath: process.env.ZETTELKASTEN_DATABASE_PATH || "data/db/zettelkasten.db",
  serverName: pkg.name,
  serverVersion: pkg.version,
  idDateFormat: "%Y%m%dT%H%M%S",
  logLevel: process.env.ZETTELKASTEN_LOG_LEVEL || "INFO",
} as const;
```

### 2. Utility Folder Structure
Create organized utility folders under `src/utils/`:

```
src/utils/
├── path/
│   ├── get-absolute-path.ts  # getAbsolutePath()
│   ├── get-notes-dir.ts      # getNotesDir() (with dir creation)
│   ├── get-database-path.ts  # getDatabasePath() (with dir creation)
│   └── get-db-url.ts         # getDbUrl()
├── markdown.ts               # existing
├── id-generator.ts           # existing
└── logger.ts                 # existing
```

**Naming convention:** Each file is named after its function in kebab-case (e.g., `getAbsolutePath()` → `get-absolute-path.ts`)

**Rationale:** Groups related utilities together. The `path/` folder contains all path-related operations.

### 3. Directory Creation as Side Effect
Keep the directory creation behavior (`fs.mkdirSync`) within the path utilities.

**Rationale:** This maintains the existing lazy-initialization behavior. Directories are created only when first accessed, not at config load time.

**Alternative considered:** Create all directories at startup. **Rejected:** Would change initialization behavior and could cause unnecessary directory creation.

### 4. Import Updates
Change imports from:
```typescript
import { config } from "../config/index.js";
// usage: config.getNotesDir()
```

To:
```typescript
import { config } from "../config/index.js";
import { getNotesDir } from "../utils/path/get-notes-dir.js";
// usage: getNotesDir(config.notesDir)
```

**Rationale:** Explicit dependency injection makes utilities more testable. Config values are passed as parameters rather than accessed via `this`.

## Risks / Trade-offs

### Risk: Circular Dependencies
[Risk] New utilities might import config, while config imports from other modules.

**Mitigation:** Utilities will be pure functions that accept config values as parameters, not import config directly.

### Risk: Missed Import Updates
[Risk] Some files might still try to call `config.getNotesDir()` methods.

**Mitigation:** TypeScript compilation will catch these errors. All 5 affected files will be updated systematically.

### Trade-off: More Import Statements
Each utility now requires a separate import statement.

**Consideration:** Slightly more verbose but clearer dependencies. Could add a `src/utils/path/index.ts` barrel export if needed.

## Migration Plan

1. Create new utility files in `src/utils/path/`
2. Create new `src/config/index.ts` with plain object
3. Update all 5 importing files to use new utilities
4. Delete `src/config/config-class.ts`
5. Run TypeScript compiler to verify no errors
6. Test that the server starts and all MCP tools work

**Rollback:** Keep git commit atomic. If issues arise, revert the single commit.

## Open Questions

None - the refactoring scope is well-defined.
