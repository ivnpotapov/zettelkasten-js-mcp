/**
 * Domain service for link-related business logic
 * Handles bidirectional link type mapping and validation
 */

import { LinkType } from "../entities/note.js";

/**
 * Domain service for managing link semantics
 */
export class LinkService {
  private readonly inverseMap: ReadonlyMap<LinkType, LinkType>;

  constructor() {
    // Initialize the inverse link type mapping (immutable)
    const map = new Map<LinkType, LinkType>();
    map.set(LinkType.REFERENCE, LinkType.REFERENCE);
    map.set(LinkType.EXTENDS, LinkType.EXTENDED_BY);
    map.set(LinkType.EXTENDED_BY, LinkType.EXTENDS);
    map.set(LinkType.REFINES, LinkType.REFINED_BY);
    map.set(LinkType.REFINED_BY, LinkType.REFINES);
    map.set(LinkType.CONTRADICTS, LinkType.CONTRADICTED_BY);
    map.set(LinkType.CONTRADICTED_BY, LinkType.CONTRADICTS);
    map.set(LinkType.QUESTIONS, LinkType.QUESTIONED_BY);
    map.set(LinkType.QUESTIONED_BY, LinkType.QUESTIONS);
    map.set(LinkType.SUPPORTS, LinkType.SUPPORTED_BY);
    map.set(LinkType.SUPPORTED_BY, LinkType.SUPPORTS);
    map.set(LinkType.RELATED, LinkType.RELATED);
    this.inverseMap = map;
  }

  /**
   * Get the inverse link type for a given link type
   * Used when creating bidirectional links
   */
  getInverseLinkType(linkType: LinkType): LinkType {
    return this.inverseMap.get(linkType) ?? linkType;
  }

  /**
   * Validate that a link type is valid
   */
  isValidLinkType(linkType: string): linkType is LinkType {
    return Object.values(LinkType).includes(linkType as LinkType);
  }

  /**
   * Check if a link type is self-inverse (e.g., reference, related)
   */
  isSelfInverse(linkType: LinkType): boolean {
    const inverse = this.getInverseLinkType(linkType);
    return inverse === linkType;
  }

  /**
   * Check if a link type is directional (has a distinct inverse)
   */
  isDirectional(linkType: LinkType): boolean {
    return !this.isSelfInverse(linkType);
  }
}
