## Why

The Zettelkasten MCP server project currently lacks formal specifications documenting its behavior and requirements. Creating baseline specifications establishes a clear contract for how the system works, serving as the foundation for future development, testing, and maintenance.

## What Changes

- Create initial specification documents for all core capabilities
- Document the dual storage model (Markdown files + SQLite database)
- Specify MCP tool behaviors and naming conventions
- Define bidirectional link semantics and inverse type mappings

## Capabilities

### New Capabilities

- `note-management`: CRUD operations for Zettelkasten notes, including creation with auto-generated IDs, updates, deletion, and retrieval of individual notes or all notes

- `link-management`: Creation and management of bidirectional links between notes, including automatic inverse link type application (e.g., `extends` ↔ `extended_by`)

- `search`: Query operations for finding notes by various criteria including full-text search, tag filtering, date range queries, finding orphan notes, and identifying central/hub notes

### Modified Capabilities

None - this is the initial specification creation.

## Impact

- Establishes `openspec/specs/` directory structure
- Creates specification files for all core capabilities
- Provides reference for MCP tool implementation (`zk_*` prefixed tools)
- Documents the contract between Markdown storage (source of truth) and SQLite indexing layer
- No code changes required - this is documentation only
