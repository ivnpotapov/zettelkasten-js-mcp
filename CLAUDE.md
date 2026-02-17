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

### Layer Structure

```
src/
├── server/mcp-server.ts    # MCP server, tool registration (@modelcontextprotocol/sdk)
├── services/
│   ├── zettel-service.ts  # Business logic for notes and links
│   └── search-service.ts  # Search operations (central notes, orphans, date ranges)
├── storage/
│   └── note-repository.ts  # Dual storage layer (Markdown files + SQLite)
├── models/
│   ├── types.ts         # TypeScript interfaces (Note, Link, Tag, enums)
│   └── database.ts      # SQLite schema initialization
├── config/
│   └── config-class.ts   # Environment-based configuration (notes dir, db path)
├── utils/
│   ├── markdown.ts       # Markdown serialization/deserialization with gray-matter
│   ├── id-generator.ts   # Timestamp-based note ID generation
│   └── logger.ts        # Logging utility
└── index.ts            # Entry point
```

### Key Data Flow

When creating/updating notes:
1. `ZettelService` handles business logic
2. `NoteRepository.create()` or `update()` writes to Markdown file
3. `NoteRepository.indexNote()` updates SQLite index

When searching:
1. Queries use SQLite for performance
2. Full note data loaded from Markdown files as needed

### Bidirectional Link Semantics

Links have inverse types (e.g., `extends` ↔ `extended_by`). When creating bidirectional links via `createLink()`, the inverse link type is automatically applied. See `ZettelService.getInverseLinkType()` for the mapping.

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
