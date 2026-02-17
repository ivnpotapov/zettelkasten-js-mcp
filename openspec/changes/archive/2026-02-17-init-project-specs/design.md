# Design: Initial Project Specifications

## Context

The Zettelkasten MCP server currently has no formal specifications documenting its behavior. The codebase is implemented and functional, with three main service layers:

- **ZettelService** (`src/services/zettel-service.ts`): Handles note CRUD operations, link management, and tag operations
- **SearchService** (`src/services/search-service.ts`): Handles search and discovery operations
- **McpServer** (`src/server/mcp-server.ts`): Exposes MCP tools with `zk_` prefix

The system uses a dual storage model:
- **Markdown files** (`data/notes/`): Source of truth for note data
- **SQLite database** (`data/db/zettelkasten.db`): Index for efficient queries

## Goals / Non-Goals

**Goals:**
- Create baseline specifications that accurately document the current implementation
- Establish a specification structure that can be maintained alongside code
- Document the contract between Markdown storage and SQLite indexing
- Define MCP tool behaviors and naming conventions

**Non-Goals:**
- No code changes are required
- No behavioral changes to existing functionality
- No new features or capabilities

## Decisions

### Specification Organization
Specifications are organized by **capability** rather than by tool or service. Each capability file (`specs/<capability>/spec.md`) contains all requirements for that functional area:

- `note-management`: Note CRUD, tags, export
- `link-management`: Link creation/removal with bidirectional semantics
- `search`: All search and discovery operations

**Rationale:** Capability-based organization groups related requirements regardless of which service or tool implements them. This makes specs more maintainable when implementation details change.

### Delta Spec Format
The delta spec format uses explicit headers (`## ADDED`, `## MODIFIED`, `## REMOVED`, `## RENAMED`) to track changes relative to main specs.

**Rationale:** This format enables intelligent merging during `/opsx:sync` operations. For example, adding a new scenario under `## MODIFIED` only modifies that requirement without affecting others.

### SHALL/MUST Language
All requirements use normative language (SHALL/MUST) rather than permissive language (should/may).

**Rationale:** This follows RFC 2119 conventions and creates unambiguous, testable requirements.

### Requirement-Scenario Structure
Each requirement MUST have at least one scenario in WHEN/THEN format.

**Rationale:** Scenarios serve as test cases and provide concrete examples of expected behavior.

## Risks / Trade-offs

### Risk: Specs May Diverge from Implementation
[Risk] As code evolves, specifications may become outdated if not updated alongside code changes.

**Mitigation:** Use the OpenSpec workflow to require specification updates for any behavioral changes. The proposal → specs → design → tasks flow ensures specs are reviewed before implementation.

### Trade-off: Specification Granularity
The current specs document behavior at the service/tool level, not at the individual function level.

**Consideration:** More granular specs (e.g., individual function behaviors) would be more detailed but also more maintenance burden. The current level strikes a balance between completeness and maintainability.

## Migration Plan

No migration is required as this change is documentation-only. The specifications will be:

1. Created in the change directory: `openspec/changes/init-project-specs/specs/`
2. Synced to main specs directory: `openspec/specs/` via `/opsx:sync`
3. Archived once complete via `/opsx:archive`

## Open Questions

None - this is a documentation effort for existing, stable functionality.
