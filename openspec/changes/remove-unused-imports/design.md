# Design: Remove Unused Imports and Variables

## Context

The codebase currently contains unused imports, variables, and type declarations that accumulate during refactoring and development. Biome linter can detect these issues automatically.

**Constraints**:
- Must not change any runtime behavior
- Must maintain all existing functionality
- Use existing Biome linter tooling

## Goals / Non-Goals

**Goals:**
- Remove all unused import statements
- Remove all unused variables
- Remove all unused type declarations and interfaces
- Achieve clean linter report

**Non-Goals:**
- Changing code logic or behavior
- Refactoring code structure (separate from this cleanup)
- Adding new capabilities

## Decisions

### Use Biome Linter Auto-Fix
**Decision**: Use `npm run lint:fix` to automatically remove unused imports and variables.

**Rationale**: Biome's auto-fix is safe for this type of cleanup and handles most cases automatically. Manual cleanup only for edge cases.

**Alternatives considered**:
- **Manual removal**: Rejected - time-consuming and error-prone
- **ESLint unused-vars**: Rejected - Biome is already configured and integrated

### Run Build Verification
**Decision**: Run `npm run build` after cleanup to verify no compilation errors.

**Rationale**: TypeScript compiler will catch any issues if auto-fix removed something that was actually needed.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Auto-fix removes actually needed code** | Build verification + manual review of changes |
| **Linter false positives** | Review git diff before committing |

## Migration Plan

1. Run `npm run lint:fix` to auto-fix detected issues
2. Review git diff to verify changes
3. Run `npm run build` to verify no compilation errors
4. Manually fix any remaining issues that auto-fix couldn't handle
5. Commit changes

### Rollback Strategy
- Git commit before cleanup allows easy rollback: `git revert <commit>`
