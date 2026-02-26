/**
 * Domain entity types for Zettelkasten notes
 * Value objects with factory methods for creation and updates
 */

import { NOTE_TYPE } from "../../../models/note/constants.js";
import type { LinkType, NoteType } from "../../../models/note/types.js";
import { generateId } from "../../../utils/id-generator.js";

/**
 * A tag for categorizing notes
 */
export type Tag = {
  name: string;
};

/**
 * Metadata stored in frontmatter
 */
export type NoteMetadata = {
  id?: string;
  title?: string;
  type?: NoteType | string;
  tags?: string | string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;
};

/**
 * A link between two notes
 */
export type Link = {
  sourceId: string;
  targetId: string;
  linkType: LinkType;
  description?: string;
  createdAt: Date;
};

/**
 * A Zettelkasten note - domain entity
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  tags: Tag[];
  links: Link[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
};

/**
 * A search result with a note and its relevance score
 */
export type SearchResult = {
  note: Note;
  score: number;
  matchedTerms: Set<string>;
  matchedContext: string;
};

/**
 * Create a new note with validation
 * @throws Error if title or content is empty
 */
export function createNote(input: {
  title: string;
  content: string;
  noteType?: NoteType;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Note {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Title is required");
  }
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Content is required");
  }

  const now = new Date();
  return {
    id: generateId(),
    title: input.title.trim(),
    content: input.content,
    noteType: input.noteType ?? NOTE_TYPE.PERMANENT,
    tags: (input.tags ?? []).map((name) => ({ name })),
    links: [],
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata ?? {},
  };
}

/**
 * Add a tag to a note (returns updated note)
 */
export function addTagToNote(note: Note, tagName: string): Note {
  const trimmedName = tagName.trim();
  if (!trimmedName) {
    return note;
  }

  // Check if tag already exists
  if (note.tags.some((t) => t.name === trimmedName)) {
    return note;
  }

  return {
    ...note,
    tags: [...note.tags, { name: trimmedName }],
    updatedAt: new Date(),
  };
}

/**
 * Remove a tag from a note (returns updated note)
 */
export function removeTagFromNote(note: Note, tagName: string): Note {
  return {
    ...note,
    tags: note.tags.filter((t) => t.name !== tagName),
    updatedAt: new Date(),
  };
}

/**
 * Add a link to a note (returns updated note)
 */
export function addLinkToNote(note: Note, link: Link): Note {
  // Check if link already exists
  const linkExists = note.links.some(
    (l) => l.targetId === link.targetId && l.linkType === link.linkType,
  );

  if (linkExists) {
    return note;
  }

  return {
    ...note,
    links: [...note.links, link],
    updatedAt: new Date(),
  };
}

/**
 * Remove a link from a note by target ID (returns updated note)
 */
export function removeLinkFromNote(note: Note, targetId: string): Note {
  return {
    ...note,
    links: note.links.filter((l) => l.targetId !== targetId),
    updatedAt: new Date(),
  };
}

/**
 * Create a link value object
 */
export function createLink(input: {
  sourceId: string;
  targetId: string;
  linkType: LinkType;
  description?: string;
}): Link {
  return {
    sourceId: input.sourceId,
    targetId: input.targetId,
    linkType: input.linkType,
    description: input.description,
    createdAt: new Date(),
  };
}
