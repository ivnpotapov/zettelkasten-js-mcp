# Tasks: Remove Unused Imports and Variables

## 1. Auto-Fix with Linter

- [x] 1.1 Run `npm run lint:fix` to auto-remove unused imports and variables
- [x] 1.2 Review git diff to verify changes are correct
- [x] 1.3 Run `npm run build` to verify no compilation errors

## 2. Manual Cleanup

- [x] 2.1 Check for remaining linter warnings
- [x] 2.2 Manually remove any remaining unused imports that auto-fix missed
- [x] 2.3 Manually remove any remaining unused variables
- [x] 2.4 Manually remove any remaining unused type declarations

## 3. Final Verification

- [x] 3.1 Run `npm run lint` - verify clean output
- [x] 3.2 Run `npm run build` - verify clean compilation
- [x] 3.3 Run `npm run typecheck` - verify type safety
- [x] 3.4 Test MCP server starts without errors
