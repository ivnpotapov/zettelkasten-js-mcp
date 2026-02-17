/**
 * Types of notes in a Zettelkasten
 */
export enum NoteType {
  FLEETING = "fleeting", // Quick, temporary notes
  LITERATURE = "literature", // Notes from reading material
  PERMANENT = "permanent", // Permanent, well-formulated notes
  STRUCTURE = "structure", // Structure/index notes that organize other notes
  HUB = "hub", // Hub notes that serve as entry points
}

/**
 * Types of links between notes
 */
export enum LinkType {
  REFERENCE = "reference", // Simple reference to another note
  EXTENDS = "extends", // Current note extends another note
  EXTENDED_BY = "extended_by", // Current note is extended by another note
  REFINES = "refines", // Current note refines another note
  REFINED_BY = "refined_by", // Current note is refined by another note
  CONTRADICTS = "contradicts", // Current note contradicts another note
  CONTRADICTED_BY = "contradicted_by", // Current note is contradicted by another note
  QUESTIONS = "questions", // Current note questions another note
  QUESTIONED_BY = "questioned_by", // Current note is questioned by another note
  SUPPORTS = "supports", // Current note supports another note
  SUPPORTED_BY = "supported_by", // Current note is supported by another note
  RELATED = "related", // Notes are related in some way
}

/**
 * A tag for categorizing notes
 */
export interface Tag {
  name: string;
}

/**
 * A link between two notes
 */
export interface Link {
  sourceId: string;
  targetId: string;
  linkType: LinkType;
  description?: string;
  createdAt: Date;
}

/**
 * Metadata stored in frontmatter
 */
export interface NoteMetadata {
  id?: string;
  title?: string;
  type?: NoteType | string;
  tags?: string | string[];
  created?: string;
  updated?: string;
  [key: string]: any;
}

/**
 * A Zettelkasten note
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  tags: Tag[];
  links: Link[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * A search result with a note and its relevance score
 */
export interface SearchResult {
  note: Note;
  score: number;
  matchedTerms: Set<string>;
  matchedContext: string;
}

/**
 * Create note input parameters
 */
export interface CreateNoteInput {
  title: string;
  content: string;
  noteType?: NoteType;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Update note input parameters
 */
export interface UpdateNoteInput {
  noteId: string;
  title?: string;
  content?: string;
  noteType?: NoteType;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Create link input parameters
 */
export interface CreateLinkInput {
  sourceId: string;
  targetId: string;
  linkType?: LinkType;
  description?: string;
  bidirectional?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions {
  text?: string;
  tags?: string[];
  noteType?: NoteType;
  linkedTo?: string;
  linkedFrom?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}
