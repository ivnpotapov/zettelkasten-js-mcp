# Search

Purpose: Define the behavior of searching and discovering notes in the Zettelkasten.

## ADDED Requirements

### Requirement: Full-text search
The system SHALL allow searching for notes by text content in titles and content fields. The search SHALL be case-insensitive. Results SHALL be scored and sorted by relevance.

#### Scenario: Search by text in title
- **WHEN** a user searches for text that appears in note titles
- **THEN** the system returns matching notes with title matches ranked higher

#### Scenario: Search by text in content
- **WHEN** a user searches for text that appears in note content
- **THEN** the system returns matching notes with content snippets showing match context

#### Scenario: Search with no results
- **WHEN** a user searches for text that does not match any notes
- **THEN** the system returns an empty result set

#### Scenario: Search is case-insensitive
- **WHEN** a user searches for text with specific capitalization
- **THEN** the system returns matches regardless of capitalization

### Requirement: Combined search criteria
The system SHALL allow searching with multiple criteria simultaneously: text query, tags, note type, and date range. All specified criteria MUST be satisfied for a note to match.

#### Scenario: Search with text and tags
- **WHEN** a user searches with both a text query and tags
- **THEN** the system returns notes matching both the text and having at least one of the specified tags

#### Scenario: Search with note type filter
- **WHEN** a user searches with a specific note type
- **THEN** the system returns only notes of that type

#### Scenario: Search with date range
- **WHEN** a user searches with a start date and/or end date
- **THEN** the system returns only notes created within the specified date range

#### Scenario: Search with all criteria
- **WHEN** a user searches with text, tags, note type, and date range
- **THEN** the system returns notes satisfying all specified conditions

### Requirement: Search results limit
The system SHALL allow limiting the number of search results returned. Results SHALL be sorted by relevance score before limiting.

#### Scenario: Search with explicit limit
- **WHEN** a user searches with a specified limit
- **THEN** the system returns at most that many results

#### Scenario: Search defaults to limit of 10
- **WHEN** a user searches without specifying a limit
- **THEN** the system returns at most 10 results

### Requirement: Tag-based search
The system SHALL allow finding notes by tag. When multiple tags are specified, the system SHALL return notes that have ANY of the specified tags (OR logic).

#### Scenario: Search by single tag
- **WHEN** a user searches for notes with a specific tag
- **THEN** the system returns all notes that have that tag

#### Scenario: Search by multiple tags
- **WHEN** a user searches for notes with multiple tags
- **THEN** the system returns notes that have at least one of the specified tags

#### Scenario: Search by tag with no matches
- **WHEN** a user searches for a tag that no notes have
- **THEN** the system returns an empty list

### Requirement: Orphaned notes detection
The system SHALL allow finding notes with no incoming or outgoing links. These are "orphaned" notes that are not connected to the knowledge network.

#### Scenario: Find orphaned notes
- **WHEN** a user requests orphaned notes
- **THEN** the system returns notes that have zero links in both directions

#### Scenario: No orphaned notes exist
- **WHEN** all notes have at least one link
- **THEN** the system returns an empty list

### Requirement: Central notes discovery
The system SHALL allow finding the most connected notes in the Zettelkasten, ranked by total number of connections (incoming + outgoing links). This identifies "hub" notes that are central to the knowledge network.

#### Scenario: Find top central notes
- **WHEN** a user requests central notes with a limit
- **THEN** the system returns the top N notes sorted by total connection count

#### Scenario: Central notes sorted by connections
- **WHEN** multiple notes are returned as central
- **THEN** they are ordered from most to least connected

#### Scenario: No notes have connections
- **WHEN** no notes have any links
- **THEN** the system returns an empty list

### Requirement: Date range filtering
The system SHALL allow finding notes created or updated within a specified date range. The date field used (createdAt or updatedAt) SHALL be configurable.

#### Scenario: Find notes created after date
- **WHEN** a user specifies a start date only
- **THEN** the system returns notes created on or after the start date

#### Scenario: Find notes created before date
- **WHEN** a user specifies an end date only
- **THEN** the system returns notes created on or before the end date

#### Scenario: Find notes in date range
- **WHEN** a user specifies both start and end dates
- **THEN** the system returns notes created within the inclusive range

#### Scenario: Find notes by updated date
- **WHEN** a user specifies useUpdated=true
- **THEN** the system filters by the updatedAt field instead of createdAt

#### Scenario: Date results sorted by date
- **WHEN** multiple notes match the date criteria
- **THEN** they are sorted by date in descending order (newest first)

### Requirement: Similar notes discovery
The system SHALL allow finding notes similar to a given note based on shared tags, shared links, and mutual connections. Similarity SHALL be scored from 0.0 to 1.0.

#### Scenario: Find similar notes
- **WHEN** a user requests notes similar to a specified note
- **THEN** the system returns notes with similarity scores above the threshold

#### Scenario: Similar notes respect threshold
- **WHEN** a user specifies a similarity threshold
- **THEN** only notes meeting or exceeding the threshold are returned

#### Scenario: Similar notes sorted by score
- **WHEN** multiple similar notes are found
- **THEN** they are sorted by similarity score in descending order

#### Scenario: No similar notes meet threshold
- **WHEN** no notes meet the similarity threshold
- **THEN** the system returns an empty list

### Requirement: Search result metadata
Each search result SHALL include the matched note, a relevance score, matched terms, and a context snippet showing where the match occurred.

#### Scenario: Search result includes score
- **WHEN** a user performs a text search
- **THEN** each result includes a numeric score indicating relevance

#### Scenario: Search result includes context
- **WHEN** a user performs a text search
- **THEN** each result includes a text snippet showing where the match occurred
