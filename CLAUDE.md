# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript/JavaScript implementation of a Zettelkasten knowledge management system as a Model Context Protocol (MCP) server. It provides tools for creating, linking, and searching atomic notes through Claude Desktop.

## Development Commands

```bash
# Install dependencies
npm install

# Build the project (TypeScript compilation)
npm run build

# Run TypeScript compiler in watch mode during development
npm run dev

# Type check without emitting files
npm run typecheck

# Lint with Biome
npm run lint
npm run lint:fix

# Format with Biome
npm run format

# Start the server (builds first if needed)
npm start

# Start the server with custom settings
node dist/index.js --notes-dir ./data/notes --database-path ./data/db/zettelkasten.db --log-level DEBUG

# Show help
npm run help
```

## Architecture

### Modular Architecture (DDD-Inspired)

The codebase follows a **four-layer clean architecture** with dependency inversion:

```
src/
├── domain/                    # Pure business logic (no infrastructure)
│   ├── entities/
│   │   └── note.ts           # Note, Link, Tag value objects + factory methods
│   ├── interfaces/
│   │   └── repository.ts     # INoteRepository interface
│   └── services/
│       ├── link-service.ts   # LinkType inverses, validation
│       └── similarity-service.ts  # Similarity algorithm
│
├── infrastructure/            # External concerns
│   └── persistence/
│       ├── interfaces/
│       │   └── file-store.ts  # IMarkdownFileStore, ISqliteIndex
│       ├── markdown-file-store.ts
│       ├── sqlite-index.ts
│       └── dual-storage-note-repository.ts
│
├── application/               # Use cases (orchestration)
│   ├── factory.ts            # Dependency injection
│   └── use-cases/
│       ├── create-note.ts
│       ├── search-notes.ts
│       ├── create-link.ts
│       └── ... (one per user action)
│
└── interfaces/                # External systems
    └── mcp/
        ├── server.ts         # MCP server setup
        └── tool-handlers/
            └── index.ts      # All tool registrations
```

### Dependency Rules

**Critical**: Dependencies flow **inward** only:
- `interfaces/` → `application/` → `infrastructure/` → `domain/`
- Domain layer has **zero** dependencies on other layers
- Infrastructure implements domain interfaces
- Use cases depend on domain interfaces, not concrete implementations

### Dual Storage Model

The system uses a dual storage approach that is fundamental to understanding data flow:

1. **Markdown Files (`data/notes/`)**: The **source of truth**. All notes are stored as human-readable Markdown files with YAML frontmatter. These can be:
   - Edited directly in any text editor
   - Version controlled with Git
   - Backed up with standard file backup tools

2. **SQLite Database (`data/db/zettelkasten.db`)**: An indexing layer for efficient queries:
   - Enables fast search and link traversal
   - Automatically rebuilt from Markdown files when needed (via `zk_rebuild_index` tool or on startup if counts don't match)
   - Never contains data that doesn't exist in the Markdown files

### Key Data Flow

**When creating/updating notes:**
1. Use case (e.g., `CreateNoteUseCase`) orchestrates the operation
2. `NoteFactory.create()` validates and creates the domain entity
3. `DualStorageNoteRepository.create()` writes to Markdown file (source of truth)
4. `SqliteIndex.indexNote()` updates the database index

**When searching:**
1. Use case delegates to repository
2. `SqliteIndex.query()` returns note IDs matching criteria
3. `MarkdownFileStore.read()` loads full note data from filesystem

### Bidirectional Link Semantics

Links have inverse types (e.g., `extends` ↔ `extended_by`). When creating bidirectional links via `CreateLinkUseCase`, `LinkService.getInverseLinkType()` provides the inverse type mapping.

### Configuration

Environment variables (create `.env` from `.env.example`):
- `ZETTELKASTEN_NOTES_DIR`: Path to Markdown note files
- `ZETTELKASTEN_DATABASE_PATH`: Path to SQLite database
- `ZETTELKASTEN_LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

### TypeScript Configuration

- Target: ES2022, Module: NodeNext (uses `.js` extensions in imports)
- Output: `dist/` directory
- Strict mode enabled

### MCP Tool Naming Convention

All tools are prefixed with `zk_` for organization (e.g., `zk_create_note`, `zk_search_notes`).
