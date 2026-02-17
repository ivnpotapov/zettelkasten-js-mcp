# Note Management

Purpose: Define the behavior of creating, reading, updating, and deleting Zettelkasten notes.

## ADDED Requirements

### Requirement: Auto-generated note IDs
The system SHALL generate a unique timestamp-based ID for each new note automatically. The ID SHALL be assigned at creation time and SHALL NOT be modified during the note's lifetime.

#### Scenario: Note creation generates unique ID
- **WHEN** a user creates a new note with title and content
- **THEN** the system assigns a unique timestamp-based ID to the note

### Requirement: Required note fields
The system SHALL require both title and content fields when creating a note. If either field is missing or empty, the system SHALL reject the creation with an error.

#### Scenario: Create note with valid data
- **WHEN** a user creates a note with a non-empty title and non-empty content
- **THEN** the system creates the note successfully

#### Scenario: Reject note without title
- **WHEN** a user attempts to create a note without a title
- **THEN** the system returns an error indicating title is required

#### Scenario: Reject note without content
- **WHEN** a user attempts to create a note without content
- **THEN** the system returns an error indicating content is required

### Requirement: Note type classification
The system SHALL support note types: fleeting, literature, permanent, structure, and hub. If no type is specified, the system SHALL default to "permanent".

#### Scenario: Create note with explicit type
- **WHEN** a user creates a note specifying a note type
- **THEN** the system creates the note with the specified type

#### Scenario: Create note defaults to permanent type
- **WHEN** a user creates a note without specifying a type
- **THEN** the system creates the note with type "permanent"

### Requirement: Tag management
The system SHALL allow notes to have zero or more tags. Tags SHALL be stored as name strings associated with each note.

#### Scenario: Create note with tags
- **WHEN** a user creates a note with a comma-separated list of tags
- **THEN** the system creates the note with all specified tags

#### Scenario: Create note without tags
- **WHEN** a user creates a note without specifying tags
- **THEN** the system creates the note with an empty tag list

### Requirement: Note retrieval by ID
The system SHALL allow retrieving a note by its unique ID.

#### Scenario: Retrieve existing note by ID
- **WHEN** a user requests a note using a valid note ID
- **THEN** the system returns the complete note data

#### Scenario: Attempt to retrieve non-existent note
- **WHEN** a user requests a note using an ID that does not exist
- **THEN** the system returns a "not found" error

### Requirement: Note retrieval by title
The system SHALL allow retrieving a note by its title.

#### Scenario: Retrieve existing note by title
- **WHEN** a user requests a note using an existing note title
- **THEN** the system returns the complete note data

#### Scenario: Attempt to retrieve non-existent note by title
- **WHEN** a user requests a note using a title that does not exist
- **THEN** the system returns a "not found" error

### Requirement: Note updates
The system SHALL allow updating existing notes. Each update SHALL automatically set the `updatedAt` timestamp to the current time. Only specified fields SHALL be modified; unspecified fields SHALL retain their existing values.

#### Scenario: Update note title
- **WHEN** a user updates a note with a new title
- **THEN** the system updates the title and sets `updatedAt` to current time

#### Scenario: Update note content
- **WHEN** a user updates a note with new content
- **THEN** the system updates the content and sets `updatedAt` to current time

#### Scenario: Update note tags
- **WHEN** a user updates a note with new tags
- **THEN** the system replaces the existing tags with the new tags

#### Scenario: Update note type
- **WHEN** a user updates a note with a new note type
- **THEN** the system updates the note type

#### Scenario: Update non-existent note
- **WHEN** a user attempts to update a note with an ID that does not exist
- **THEN** the system returns a "not found" error

### Requirement: Note deletion
The system SHALL allow deleting notes by ID. When a note is deleted, the system SHALL remove it from both the Markdown file storage and the SQLite index.

#### Scenario: Delete existing note
- **WHEN** a user deletes a note with a valid ID
- **THEN** the system removes the note from storage and index

#### Scenario: Delete non-existent note
- **WHEN** a user attempts to delete a note with an ID that does not exist
- **THEN** the system returns a "not found" error

### Requirement: List all notes
The system SHALL allow retrieving all notes in the Zettelkasten.

#### Scenario: Retrieve all notes
- **WHEN** a user requests all notes
- **THEN** the system returns a list of all notes with their complete data

### Requirement: Add tag to existing note
The system SHALL allow adding a single tag to an existing note without replacing existing tags. If the tag already exists on the note, the system SHALL make no changes.

#### Scenario: Add new tag to note
- **WHEN** a user adds a new tag to an existing note
- **THEN** the system adds the tag to the note's tag list and updates `updatedAt`

#### Scenario: Add duplicate tag to note
- **WHEN** a user attempts to add a tag that already exists on the note
- **THEN** the system makes no changes and returns the existing note

### Requirement: Remove tag from note
The system SHALL allow removing a single tag from an existing note. Other tags SHALL remain unchanged.

#### Scenario: Remove existing tag from note
- **WHEN** a user removes a tag from a note
- **THEN** the system removes the tag and updates `updatedAt`

### Requirement: List all tags
The system SHALL allow retrieving all unique tags across all notes in the system, sorted alphabetically case-insensitively.

#### Scenario: Retrieve all tags
- **WHEN** a user requests all tags
- **THEN** the system returns a list of unique tag names sorted alphabetically

#### Scenario: Retrieve tags when no tags exist
- **WHEN** a user requests all tags when no notes have tags
- **THEN** the system returns an empty list

### Requirement: Note export
The system SHALL allow exporting a note in Markdown format.

#### Scenario: Export note to Markdown
- **WHEN** a user exports a note by ID in Markdown format
- **THEN** the system returns the note formatted as Markdown with YAML frontmatter

#### Scenario: Export non-existent note
- **WHEN** a user attempts to export a note with an ID that does not exist
- **THEN** the system returns a "not found" error
