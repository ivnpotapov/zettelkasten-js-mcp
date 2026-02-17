/**
 * Markdown and frontmatter utilities for Zettelkasten notes
 */

import matter from "gray-matter";

import {
  type Link,
  LinkType,
  type Note,
  type NoteMetadata,
  NoteType,
  type Tag,
} from "../models/types.js";

/**
 * Default note template
 */
const _DEFAULT_NOTE_TEMPLATE =
  "# {title}\n\n" +
  "## Metadata\n" +
  "- Created: {created_at}\n" +
  "- Tags: {tags}\n\n" +
  "## Content\n\n" +
  "{content}\n\n" +
  "## Links\n" +
  "{links}\n";

/**
 * Parse a note from markdown content with frontmatter
 */
export function parseNoteFromMarkdown(content: string, id?: string): Note {
  const post = matter(content);
  const metadata: NoteMetadata = post.data;

  // Extract ID from metadata or use provided id
  const noteId = (metadata.id as string) || id || "";
  if (!noteId) {
    throw new Error("Note ID missing from frontmatter");
  }

  // Extract title from metadata or first heading
  let title = metadata.title as string;
  if (!title) {
    // Try to extract from content
    const lines = post.content.trim().split("\n");
    for (const line of lines) {
      if (line.startsWith("# ")) {
        title = line.slice(2).trim();
        break;
      }
    }
  }
  if (!title) {
    throw new Error("Note title missing from frontmatter or content");
  }

  // Extract note type
  let noteType = NoteType.PERMANENT;
  const typeStr = metadata.type as string;
  if (typeStr) {
    const typeValues = Object.values(NoteType);
    if (typeValues.includes(typeStr as NoteType)) {
      noteType = typeStr as NoteType;
    }
  }

  // Extract tags
  let tagNames: string[] = [];
  if (metadata.tags) {
    if (typeof metadata.tags === "string") {
      tagNames = metadata.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    } else if (Array.isArray(metadata.tags)) {
      tagNames = metadata.tags.map((t) => String(t).trim()).filter((t) => t);
    }
  }
  const tags: Tag[] = tagNames.map((name) => ({ name }));

  // Extract links
  const links: Link[] = [];
  const lines = post.content.split("\n");
  let inLinksSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if we're entering the links section
    if (trimmedLine.startsWith("## Links")) {
      inLinksSection = true;
      continue;
    }

    // Check if we're leaving the links section
    if (inLinksSection && trimmedLine.startsWith("## ")) {
      inLinksSection = false;
      continue;
    }

    // Parse link lines
    if (inLinksSection && trimmedLine.startsWith("- ")) {
      try {
        // Example format: - reference [[202101010000]] Optional description
        const bracketIndex = trimmedLine.indexOf("[[");
        const closeBracketIndex = trimmedLine.indexOf("]]");

        if (bracketIndex !== -1 && closeBracketIndex !== -1) {
          // Extract link type from before [[
          const linkTypeStr = trimmedLine.slice(2, bracketIndex).trim();
          // Extract target ID
          const targetId = trimmedLine
            .slice(bracketIndex + 2, closeBracketIndex)
            .trim();
          // Extract description
          let description: string | undefined;
          if (closeBracketIndex + 2 < trimmedLine.length) {
            description =
              trimmedLine.slice(closeBracketIndex + 2).trim() || undefined;
          }

          // Validate link type
          let linkType = LinkType.REFERENCE;
          const typeValues = Object.values(LinkType);
          if (typeValues.includes(linkTypeStr as LinkType)) {
            linkType = linkTypeStr as LinkType;
          }

          links.push({
            sourceId: noteId,
            targetId,
            linkType,
            description,
            createdAt: new Date(),
          });
        }
      } catch (e) {
        // Skip invalid link lines
        console.error(`Error parsing link: ${trimmedLine}`, e);
      }
    }
  }

  // Extract timestamps
  const createdStr = metadata.created as string;
  const updatedStr = metadata.updated as string;
  const createdAt = createdStr ? new Date(createdStr) : new Date();
  const updatedAt = updatedStr ? new Date(updatedStr) : createdAt;

  // Extract other metadata
  const extraMetadata: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!["id", "title", "type", "tags", "created", "updated"].includes(key)) {
      extraMetadata[key] = value;
    }
  }

  return {
    id: noteId,
    title,
    content: post.content,
    noteType,
    tags,
    links,
    createdAt,
    updatedAt,
    metadata: extraMetadata,
  };
}

/**
 * Convert a note to markdown with frontmatter
 */
export function noteToMarkdown(note: Note): string {
  // Create frontmatter
  const metadata: NoteMetadata = {
    id: note.id,
    title: note.title,
    type: note.noteType,
    tags: note.tags.map((t) => t.name),
    created: note.createdAt.toISOString(),
    updated: note.updatedAt.toISOString(),
    ...note.metadata,
  };

  // Check if content already starts with the title heading
  const titleHeading = `# ${note.title}`;
  let content = note.content;
  if (!content.trim().startsWith(titleHeading)) {
    content = `${titleHeading}\n\n${content}`;
  }

  // Remove existing Links sections
  const contentParts: string[] = [];
  let skipSection = false;
  for (const line of content.split("\n")) {
    if (line.trim() === "## Links") {
      skipSection = true;
      continue;
    }
    if (skipSection && line.startsWith("## ")) {
      skipSection = false;
    }
    if (!skipSection) {
      contentParts.push(line);
    }
  }

  // Reconstruct content without Links sections
  content = contentParts.join("\n").trimEnd();

  // Add links section with deduplication
  if (note.links.length > 0) {
    const uniqueLinks = new Map<string, Link>();
    for (const link of note.links) {
      const key = `${link.targetId}:${link.linkType}`;
      uniqueLinks.set(key, link);
    }

    content += "\n\n## Links\n";
    for (const link of uniqueLinks.values()) {
      const desc = link.description ? ` ${link.description}` : "";
      content += `- ${link.linkType} [[${link.targetId}]]${desc}\n`;
    }
  }

  // Create markdown with frontmatter
  const post = matter.stringify(content, metadata);
  return post;
}

/**
 * Format a note for display
 */
export function formatNoteForDisplay(note: Note): string {
  let result = `# ${note.title}\n`;
  result += `ID: ${note.id}\n`;
  result += `Type: ${note.noteType}\n`;
  result += `Created: ${note.createdAt.toISOString()}\n`;
  result += `Updated: ${note.updatedAt.toISOString()}\n`;

  if (note.tags.length > 0) {
    result += `Tags: ${note.tags.map((t) => t.name).join(", ")}\n`;
  }

  result += `\n${note.content}\n`;

  return result;
}
