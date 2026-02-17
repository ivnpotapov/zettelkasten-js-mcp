# Proposal: Read Server Config from package.json

## Why

Currently `serverName` and `serverVersion` in `ZettelkastenConfig` are sourced from environment variables with hardcoded fallbacks. This creates a dual source of truth since the actual project name and version live in `package.json`. When the package version is updated, the config must also be updated manually - a common source of divergence.

## What Changes

- `ZettelkastenConfig.serverName` will be read from `package.json` `name` field
- `ZettelkastenConfig.serverVersion` will be read from `package.json` `version` field
- Environment variables `ZETTELKASTEN_SERVER_NAME` and `ZETTELKASTEN_SERVER_VERSION` will be removed from config logic
- A typed interface for `package.json` structure will be added for type-safe imports

## Capabilities

### New Capabilities
- `config-from-package-json`: Configuration values (name, version) sourced from package.json with proper TypeScript typing

### Modified Capabilities
- `server-config`: Server configuration initialization now reads from package.json instead of environment variables

## Impact

- **Affected code**: `src/config/config-class.ts` (constructor changes, new package.json import)
- **Dependencies**: None (using built-in `fs` module or dynamic import)
- **Breaking change**: Environment variables `ZETTELKASTEN_SERVER_NAME` and `ZETTELKASTEN_SERVER_VERSION` will no longer be respected
