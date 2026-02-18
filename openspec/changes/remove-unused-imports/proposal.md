# Proposal: Remove Unused Imports and Variables

## Why

The codebase contains unused import statements, variables, and type declarations that accumulate during development. These increase code noise, reduce readability, and may confuse future maintainers. Removing them improves code hygiene and makes the actual dependencies clearer.

## What Changes

- **Remove unused import statements** across all TypeScript files
- **Remove unused variables** (both local variables and module-level declarations)
- **Remove unused type declarations** and interfaces
- **Run linter** to automatically detect and fix these issues where possible

**BREAKING**: None - this is code cleanup only with no behavioral changes

## Capabilities

### New Capabilities
None - this is a code cleanup task

### Modified Capabilities
None - existing specs (note-management, link-management, search) remain unchanged

## Impact

**Affected Code**:
- All TypeScript files in `src/` will be scanned and cleaned
- No changes to functionality or external behavior

**Dependencies**:
- Uses existing Biome linter which can detect unused imports and variables
