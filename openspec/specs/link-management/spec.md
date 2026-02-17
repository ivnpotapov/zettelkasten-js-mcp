# Link Management

Purpose: Define the behavior of creating and managing bidirectional semantic links between Zettelkasten notes.

## Requirements

### Requirement: Link type enumeration
The system SHALL support the following link types: reference, extends, extended_by, refines, refined_by, contradicts, contradicted_by, questions, questioned_by, supports, supported_by, and related. Each link type represents a specific semantic relationship between notes.

#### Scenario: Create link with explicit type
- **WHEN** a user creates a link specifying a valid link type
- **THEN** the system creates the link with the specified type

#### Scenario: Create link defaults to reference type
- **WHEN** a user creates a link without specifying a type
- **THEN** the system creates the link with type "reference"

### Requirement: Link creation requires valid notes
The system SHALL only create links between notes that exist. If either the source or target note does not exist, the system SHALL return an error.

#### Scenario: Create link with valid source and target
- **WHEN** a user creates a link between two existing note IDs
- **THEN** the system creates the link from source to target

#### Scenario: Create link with non-existent source
- **WHEN** a user attempts to create a link from a non-existent source ID
- **THEN** the system returns an error indicating the source note was not found

#### Scenario: Create link with non-existent target
- **WHEN** a user attempts to create a link to a non-existent target ID
- **THEN** the system returns an error indicating the target note was not found

### Requirement: Unidirectional link creation
When bidirectional is false or not specified, the system SHALL create a single link from the source note to the target note.

#### Scenario: Create unidirectional link
- **WHEN** a user creates a link with bidirectional=false
- **THEN** the system creates a link only from source to target

### Requirement: Bidirectional link creation with inverse semantics
When bidirectional is true, the system SHALL create two links: one from source to target with the specified type, and one from target to source with the inverse link type. The inverse type mapping SHALL be: extends ↔ extended_by, refines ↔ refined_by, contradicts ↔ contradicted_by, questions ↔ questioned_by, supports ↔ supported_by, reference ↔ reference, related ↔ related.

#### Scenario: Create bidirectional extends link
- **WHEN** a user creates a bidirectional link of type "extends"
- **THEN** the system creates an "extends" link from source to target and an "extended_by" link from target to source

#### Scenario: Create bidirectional contradicts link
- **WHEN** a user creates a bidirectional link of type "contradicts"
- **THEN** the system creates a "contradicts" link from source to target and a "contradicted_by" link from target to source

#### Scenario: Create bidirectional reference link
- **WHEN** a user creates a bidirectional link of type "reference"
- **THEN** the system creates "reference" links in both directions

### Requirement: Duplicate link prevention
The system SHALL NOT create duplicate links from the same source to the same target with the same link type. If a matching link already exists, the system SHALL skip creating the duplicate.

#### Scenario: Attempt to create duplicate link
- **WHEN** a user attempts to create a link that already exists (same source, target, and type)
- **THEN** the system does not create a duplicate and returns the existing note

#### Scenario: Create bidirectional link when reverse exists
- **WHEN** a user creates a bidirectional link and the reverse link already exists
- **THEN** the system creates only the forward link if it doesn't exist

### Requirement: Optional link description
The system SHALL allow an optional description to be attached to each link.

#### Scenario: Create link with description
- **WHEN** a user creates a link with a description
- **THEN** the system stores the description with the link

#### Scenario: Create link without description
- **WHEN** a user creates a link without a description
- **THEN** the system creates the link with no description

### Requirement: Link removal
The system SHALL allow removing links between notes. When removing a link, the system SHALL update the `updatedAt` timestamp of the modified notes.

#### Scenario: Remove unidirectional link
- **WHEN** a user removes a link from source to target
- **THEN** the system removes the link and updates the source note's `updatedAt` timestamp

#### Scenario: Remove bidirectional link
- **WHEN** a user removes a bidirectional link
- **THEN** the system removes both the forward and reverse links and updates both notes' `updatedAt` timestamps

#### Scenario: Remove link with non-existent source
- **WHEN** a user attempts to remove a link from a non-existent source ID
- **THEN** the system returns an error indicating the source note was not found

### Requirement: Retrieve linked notes
The system SHALL allow retrieving notes linked to or from a specified note. The direction parameter SHALL control which links are followed: "outgoing" for links from the note, "incoming" for links to the note, or "both" for all connected notes.

#### Scenario: Get outgoing linked notes
- **WHEN** a user requests linked notes with direction="outgoing"
- **THEN** the system returns notes that the specified note links to

#### Scenario: Get incoming linked notes
- **WHEN** a user requests linked notes with direction="incoming"
- **THEN** the system returns notes that link to the specified note

#### Scenario: Get all linked notes
- **WHEN** a user requests linked notes with direction="both"
- **THEN** the system returns all notes connected to the specified note in either direction

#### Scenario: Get linked notes for non-existent note
- **WHEN** a user attempts to get linked notes for a non-existent note ID
- **THEN** the system returns a "not found" error

#### Scenario: Get linked notes when no links exist
- **WHEN** a user requests linked notes for a note with no connections
- **THEN** the system returns an empty list
