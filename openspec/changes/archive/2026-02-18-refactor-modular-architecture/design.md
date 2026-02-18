# Design: Modular Architecture Refactoring

## Context

The current codebase follows a traditional 3-layer architecture (models → services → server) but mixes concerns in ways that create tight coupling:

- **Services layer (`ZettelService`, `SearchService`)**: Directly depends on concrete `NoteRepository` class. Domain logic (link type inverses, similarity scoring) is intermixed with orchestration.
- **Repository layer (`NoteRepository`)**: Single monolithic class handling both filesystem operations (Markdown files) and database indexing (SQLite). Violates Single Responsibility Principle.
- **Models (`types.ts`)**: Pure data types with no behavior - anemic domain model.
- **MCP Server (`mcp-server.ts`)**: 1000+ lines with all tool handlers inline, mixing protocol handling with business logic.

**Constraints**:
- Must maintain existing MCP tool behavior (no breaking changes for users)
- Dual storage model must be preserved (Markdown files as source of truth, SQLite as index)
- No new dependencies - use existing stack (better-sqlite3, gray-matter, @modelcontextprotocol/sdk)
- TypeScript strict mode, Node.js runtime

## Goals / Non-Goals

**Goals:**
- Separate business logic from infrastructure concerns
- Enable unit testing of domain rules without SQLite/filesystem
- Create clear module boundaries with dependency inversion
- Reduce coupling between services and storage
- Make codebase navigable and easier to extend

**Non-Goals:**
- Changing runtime behavior or MCP tool APIs
- Adding new capabilities during this refactoring
- Switching storage mechanisms (Markdown + SQLite stays)
- Performance optimization (focus is on structure, not speed)
- Changing the dual storage paradigm

## Decisions

### 1. Four-Layer Architecture (DDD-Inspired)

**Decision**: Organize code into four distinct layers: `domain/`, `infrastructure/`, `application/`, `interfaces/`.

**Rationale**: This follows Domain-Driven Design principles with clear dependency direction (outer depends on inner). Each layer has a single responsibility:

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| `domain/` | Business entities, value objects, domain services | None (pure TypeScript) |
| `infrastructure/` | External concerns (SQLite, filesystem) | Implements domain interfaces |
| `application/` | Use cases, orchestration | domain + infrastructure interfaces |
| `interfaces/` | MCP adapters, HTTP controllers (future) | application layer |

**Alternatives considered**:
- **Traditional 3-tier (presentation → business → data)**: Rejected - too coarse, mixes orchestration with business logic
- **Onion architecture**: Rejected - over-engineered for this project size; our 4-layer approach achieves similar separation with simpler structure
- **Package-by-feature**: Rejected - Zettelkasten has natural domain boundaries (notes, links, search) that would be obscured

### 2. Domain Interfaces for Dependency Inversion

**Decision**: Define repository and service interfaces in `src/domain/interfaces/`. Infrastructure implements these; application depends on interfaces.

```typescript
// src/domain/interfaces/repository.ts
export interface INoteRepository {
  create(note: Note): Note;
  get(id: string): Note | null;
  // ... other methods
}

// src/infrastructure/persistence/note-repository.ts
export class SqliteNoteRepository implements INoteRepository {
  // SQLite + filesystem implementation
}
```

**Rationale**: Enables swapping implementations (e.g., in-memory repository for tests). Application layer depends on abstractions, not concretions.

**Alternatives considered**:
- **Direct class inheritance**: Rejected - still couples to concrete base class
- **Dependency injection container**: Rejected - overkill for this project; constructor injection is sufficient

### 3. Split Filesystem and Database Operations

**Decision**: Separate `MarkdownFileStore` (filesystem) from `SqliteIndex` (database). Both implement interfaces and are composed in `DualStorageNoteRepository`.

```typescript
class DualStorageNoteRepository implements INoteRepository {
  constructor(
    private fileStore: IMarkdownFileStore,
    private index: ISqliteIndex
  ) {}
}
```

**Rationale**: Single Responsibility Principle. Each class has one reason to change. Also enables partial mocking in tests.

**Alternatives considered**:
- **Keep unified `NoteRepository`**: Rejected - mixes two unrelated concerns (file I/O vs database queries)
- **Repository pattern with separate repositories**: Rejected - dual storage is a single concern from domain perspective

### 4. Extract Domain Services

**Decision**: Move stateless business logic to `domain/services/`:
- `LinkService` - bidirectional link type mapping, link validation
- `SimilarityService` - note similarity scoring algorithm
- Entities with factory methods (`Note.create()`, `Link.create()`)

**Rationale**: Business rules should be testable without infrastructure. Stateful operations use repositories; stateless logic uses domain services.

**Alternatives considered**:
- **Keep logic in `ZettelService`**: Rejected - mixes orchestration with business rules
- **Static utility functions**: Rejected - domain services are more testable and can have dependencies

### 5. Use Case Classes in Application Layer

**Decision**: Create one use case class per user action (e.g., `CreateNoteUseCase`, `SearchNotesUseCase`).

```typescript
// src/application/use-cases/create-note.ts
export class CreateNoteUseCase {
  constructor(
    private noteRepo: INoteRepository,
    private linkService: LinkService
  ) {}

  execute(input: CreateNoteInput): Result<Note, Error> {
    // Orchestrate domain + infrastructure
  }
}
```

**Rationale**: Single-responsibility orchestrators. Easy to test, easy to understand, easy to reuse.

**Alternatives considered**:
- **Keep monolithic `ZettelService`**: Rejected - 400+ lines, multiple responsibilities
- **Function-based use cases**: Rejected - classes enable constructor injection and cleaner testing

### 6. One Handler File Per MCP Tool

**Decision**: Move each tool handler to its own file in `src/interfaces/mcp/tool-handlers/`.

```
src/interfaces/mcp/
├── server.ts          # Server setup and registration
└── tool-handlers/
    ├── create-note.ts
    ├── get-note.ts
    ├── update-note.ts
    └── ...
```

**Rationale**: 1000+ line server file is unmaintainable. Separate files make navigation easier and reduce merge conflicts.

**Alternatives considered**:
- **Group by domain (notes, links, search)**: Rejected - still creates large files
- **Keep inline in server.ts**: Rejected - violates single-file/single-responsibility principle

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Import path churn** - many files moved, imports break | Phase 1: Create new structure alongside old; Phase 2: Update imports incrementally; Phase 3: Delete old files |
| **Runtime behavior regression** - subtle logic changes during refactoring | Run existing test suite after each file move; add integration tests before starting |
| **Circular dependencies** - new layer structure may create import cycles | Enforce dependency rule: domain → infrastructure → application → interfaces (unidirectional) |
| **Over-abstraction** - too many interfaces for small project | Start with interfaces only where swapping implementations is needed (repositories, domain services) |
| **Testability vs complexity** - more files = more test boilerplate | Use a test helper factory that creates pre-configured use cases |

**Trade-offs**:
- **More files** (better organization) vs **navigation overhead** (mitigated by clear directory structure)
- **Dependency injection** (testability) vs **constructor verbosity** (accept as cost of clean architecture)

## Migration Plan

### Phase 1: Create New Structure (Non-Breaking)
1. Create `src/domain/` with entities and interfaces
2. Create `src/infrastructure/` with new repository implementations
3. Create `src/application/` with use cases
4. Keep all existing code in place (no deletions yet)

### Phase 2: Wire Up and Test
1. Create factory function that instantiates new architecture
2. Add integration tests covering MCP tool paths
3. Run tests to verify behavioral equivalence

### Phase 3: Update MCP Server
1. Update `mcp-server.ts` to use new use cases
2. Split tool handlers into separate files
3. Verify MCP tools work identically

### Phase 4: Cleanup
1. Delete old `src/services/` and `src/storage/` directories
2. Update all import paths
3. Run full test suite

### Rollback Strategy
- Git branch per phase
- Tag working commits
- Keep old code until new structure is verified via integration tests

## Open Questions

1. **Should we use a DI library?** For now, constructor injection is sufficient. Consider if constructor complexity grows beyond 5+ dependencies.
2. **How to handle errors in use cases?** Define a `Result<T, E>` type or use exceptions? Recommend exceptions for simplicity, given the codebase size.
3. **Should domain entities have methods?** Yes - prefer `note.addTag()` over `note.tags.push()` to encapsulate invariants.
