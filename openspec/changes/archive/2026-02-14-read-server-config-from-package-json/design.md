# Design: Read Server Config from package.json

## Context

Currently `ZettelkastenConfig` reads `serverName` and `serverVersion` from environment variables with hardcoded fallbacks. The actual project name and version in `package.json` serve as the canonical source, making the config values redundant and error-prone.

**Current state** (`src/config/config-class.ts`):
```typescript
this.serverName = process.env.ZETTELKASTEN_SERVER_NAME || "zettelkasten-mcp";
this.serverVersion = process.env.ZETTELKASTEN_SERVER_VERSION || "1.2.1";
```

**Constraints**:
- Must use ES modules (`"type": "module"` in package.json)
- Must maintain type safety (strict TypeScript enabled)
- Should avoid runtime file system operations if possible

## Goals / Non-Goals

**Goals:**
- Read `serverName` and `serverVersion` from `package.json` at build time
- Provide typed interface for `package.json` structure
- Eliminate redundant environment variables for server identity

**Non-Goals:**
- Reading other `package.json` fields (name and version only)
- Changing how other config values (notes dir, db path, etc.) are loaded

## Decisions

### Decision 1: Use TypeScript `import.assertions` for type-safe package.json access

**Choice**: Use `import` with `assert { type: "json" }` and type assertion

**Rationale**:
- Native ES module approach, no additional dependencies
- Type-safe with proper interface definition
- V8 optimizes JSON imports at runtime
- Alternatives considered:
  - `fs.readFileSync` → requires runtime I/O, not type-safe without extra code
  - Third-party packages → unnecessary dependency for simple use case

**Implementation**:
```typescript
// Define interface for package.json structure
interface PackageJson {
  name: string;
  version: string;
  // other fields as optional...
}

// Type-safe import
import pkgContent from '../../package.json' with { type: 'json' };
const pkg = pkgContent as PackageJson;

// Use values
this.serverName = pkg.name;
this.serverVersion = pkg.version;
```

### Decision 2: Remove environment variables for server name/version

**Choice**: Remove `ZETTELKASTEN_SERVER_NAME` and `ZETTELKASTEN_SERVER_VERSION` from config logic

**Rationale**:
- Single source of truth reduces confusion
- Package.json is the standard location for these values
- Users who need custom values can fork/fork the project

**Breaking change**: Users relying on these env vars will see default values from package.json instead

## Risks / Trade-offs

| Risk | Mitigation |
|-------|-----------|
| Runtime error if package.json is malformed | Build will fail (TypeScript compilation catches missing imports) |
| Deployment environments requiring custom names | Document that forking/editing package.json is the supported approach |
| Import path breaks if file structure changes | Use relative path from `dist/config/` to root `package.json` |

## Open Questions

None identified.

## Migration Plan

1. Add `PackageJson` interface to `config-class.ts`
2. Import `package.json` with type assertion
3. Update constructor to use imported values
4. Remove lines referencing `ZETTELKASTEN_SERVER_NAME` and `ZETTELKASTEN_SERVER_VERSION` env vars
5. Update `.env.example` to remove the deprecated env vars
6. Test: build and run server, verify correct name/version
