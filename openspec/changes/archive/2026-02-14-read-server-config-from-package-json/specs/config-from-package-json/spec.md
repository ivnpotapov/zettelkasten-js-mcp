# Spec: Config from package.json

## ADDED Requirements

### Requirement: Read server name from package.json

The system SHALL read the `name` field from `package.json` to populate `ZettelkastenConfig.serverName`. The import MUST be type-safe using a TypeScript interface that matches the package.json structure.

#### Scenario: Server name from package.json
- **WHEN** the application starts and `ZettelkastenConfig` is instantiated
- **THEN** `serverName` equals the value of `name` in `package.json`

#### Scenario: Type-safe package.json access
- **WHEN** reading from `package.json`
- **THEN** a TypeScript interface defines at least the `name` and `version` fields
- **AND** the import is statically typed

---

### Requirement: Read server version from package.json

The system SHALL read the `version` field from `package.json` to populate `ZettelkastenConfig.serverVersion`. The import MUST be type-safe using a TypeScript interface that matches the package.json structure.

#### Scenario: Server version from package.json
- **WHEN** the application starts and `ZettelkastenConfig` is instantiated
- **THEN** `serverVersion` equals the value of `version` in `package.json`

---

### Requirement: TypeScript interface for package.json

The system SHALL provide a TypeScript interface describing the structure of `package.json` for type-safe imports.

#### Scenario: Interface defines required fields
- **WHEN** the interface is defined
- **THEN** it includes at minimum: `name: string` and `version: string`
- **AND** optional fields may be included as needed

#### Scenario: Import uses type assertion
- **WHEN** importing `package.json`
- **THEN** the imported value is typed with the package.json interface
