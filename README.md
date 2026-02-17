# Zettelkasten MCP Server (TypeScript/JavaScript)

A Model Context Protocol (MCP) server that implements the Zettelkasten knowledge management methodology, allowing you to create, link, explore and synthesize atomic notes through Claude and other MCP-compatible clients.

This is a TypeScript/JavaScript port of the original Python implementation.

## What is Zettelkasten?

The Zettelkasten method is a knowledge management system developed by German sociologist Niklas Luhmann, who used it to produce over 70 books and hundreds of articles. It consists of three core principles:

1. **Atomicity**: Each note contains exactly one idea, making it a discrete unit of knowledge
2. **Connectivity**: Notes are linked together to create a network of knowledge, with meaningful relationships between ideas
3. **Emergence**: As the network grows, new patterns and insights emerge that weren't obvious when the individual notes were created

## Features

- Create atomic notes with unique timestamp-based IDs
- Link notes bidirectionally to build a knowledge graph
- Tag notes for categorical organization
- Search notes by content, tags, or links
- Use markdown format for human readability and editing
- Integrate with Claude through MCP for AI-assisted knowledge management
- Dual storage architecture (see below)
- Built with TypeScript for type safety and better developer experience

## Storage Architecture

This system uses a dual storage approach:

1. **Markdown Files**: All notes are stored as human-readable Markdown files with YAML frontmatter for metadata. These files are the **source of truth** and can be:
   - Edited directly in any text editor
   - Placed under version control (Git, etc.)
   - Backed up using standard file backup procedures
   - Shared or transferred like any other text files

2. **SQLite Database**: Functions as an indexing layer that:
   - Facilitates efficient querying and search operations
   - Enables Claude to quickly traverse the knowledge graph
   - Maintains relationship information for faster link traversal
   - Is automatically rebuilt from Markdown files when needed

## Installation

```bash
# Navigate to the project directory
cd zettelkasten-js-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then edit the file to configure your connection parameters.

## Usage

### Starting the Server

```bash
# Start the server with default settings
npm start

# Or with Node directly
node dist/index.js

# Or with custom settings
node dist/index.js --notes-dir ./data/notes --database-path ./data/db/zettelkasten.db --log-level DEBUG
```

### Connecting to Claude Desktop

Add the following configuration to your Claude Desktop:

```json
{
  "mcpServers": {
    "zettelkasten": {
      "command": "node",
      "args": ["/absolute/path/to/zettelkasten-js-mcp/dist/index.js"],
      "env": {
        "ZETTELKASTEN_NOTES_DIR": "/absolute/path/to/zettelkasten-js-mcp/data/notes",
        "ZETTELKASTEN_DATABASE_PATH": "/absolute/path/to/zettelkasten-js-mcp/data/db/zettelkasten.db",
        "ZETTELKASTEN_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

## Available MCP Tools

All tools have been prefixed with `zk_` for better organization:

| Tool | Description |
|---|---|
| `zk_create_note` | Create a new note with a title, content, and optional tags |
| `zk_get_note` | Retrieve a specific note by ID or title |
| `zk_update_note` | Update an existing note's content or metadata |
| `zk_delete_note` | Delete a note |
| `zk_create_link` | Create links between notes |
| `zk_remove_link` | Remove links between notes |
| `zk_search_notes` | Search for notes by content, tags, or links |
| `zk_get_linked_notes` | Find notes linked to a specific note |
| `zk_get_all_tags` | List all tags in the system |
| `zk_find_similar_notes` | Find notes similar to a given note |
| `zk_find_central_notes` | Find notes with the most connections |
| `zk_find_orphaned_notes` | Find notes with no connections |
| `zk_list_notes_by_date` | List notes by creation/update date |
| `zk_rebuild_index` | Rebuild the database index from Markdown files |

## Development

```bash
# Install dependencies
npm install

# Run TypeScript compiler in watch mode
npm run dev

# Type check without emitting files
npm run typecheck

# Build the project
npm run build
```

## Project Structure

```
zettelkasten-js-mcp/
├── src/
│   ├── config/          # Configuration module
│   ├── models/          # Data models and types
│   ├── storage/         # Storage layer (note repository)
│   ├── services/        # Business logic (ZettelService, SearchService)
│   ├── server/          # MCP server implementation
│   ├── utils/           # Utility functions
│   └── index.ts         # Main entry point
├── data/
│   ├── notes/           # Note storage (Markdown files)
│   └── db/              # Database for indexing
├── .env.example         # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

## Important Notice

**⚠️ USE AT YOUR OWN RISK**: This software is experimental and provided as-is without warranty of any kind. While efforts have been made to ensure data integrity, it may contain bugs that could potentially lead to data loss or corruption. Always back up your notes regularly and use caution when testing with important information.

## License

MIT License
