# Proposal: Refactor to Modular Architecture

## Why

The current codebase mixes business logic, infrastructure concerns, and interface adapters in a way that creates tight coupling and low cohesion. Services directly depend on concrete storage implementations, domain logic is scattered across multiple layers, and testing business rules in isolation is difficult. This refactoring implements Low Coupling/High Cohesion principles to improve maintainability, testability, and future extensibility.

## What Changes

- **Extract pure domain layer**: Move business entities (Note, Link, Tag) and domain services to `src/domain/` with zero infrastructure dependencies
- **Introduce dependency inversion**: Define repository and service interfaces in `src/domain/interfaces/` - infrastructure implements these contracts
- **Separate persistence concerns**: Reorganize storage layer into `src/infrastructure/persistence/` with separate modules for SQLite and filesystem operations
- **Create application/orchestration layer**: Move service orchestration to `src/application/` - use cases coordinate between domain and infrastructure
- **Isolate MCP interface**: Move all MCP-specific code to `src/interfaces/mcp/` with one handler file per tool

**BREAKING**: Internal imports will change - external MCP tool behavior remains identical

## Capabilities

### New Capabilities
None - this is an internal refactoring with no behavioral changes

### Modified Capabilities
None - existing specs (note-management, link-management, search) define behavior that remains unchanged

## Impact

**Affected Code**:
- All files in `src/` will be reorganized
- Import paths will change throughout the codebase
- No changes to `openspec/specs/` - behavior is preserved

**Dependencies**:
- No new dependencies required
- Existing dependencies (@modelcontextprotocol/sdk, better-sqlite3, gray-matter) remain unchanged

**Migration**:
- TypeScript imports will need updating
- Tests will need path updates
- MCP tool definitions remain the same (only internal handler locations change)
