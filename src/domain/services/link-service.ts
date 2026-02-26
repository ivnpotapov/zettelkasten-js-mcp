/**
 * Domain service for link-related business logic
 * Handles bidirectional link type mapping and validation
 */

import { LINK_TYPE } from "../../models/note/constants.js";
import type { LinkType } from "../../models/note/types.js";
import { isValidLinkType as isValidLinkTypeValue } from "../../utils/type-guards.js";

/**
 * Domain service for managing link semantics
 */
export class LinkService {
  private readonly inverseMap: ReadonlyMap<LinkType, LinkType>;

  constructor() {
    // Initialize the inverse link type mapping (immutable)
    const map = new Map<LinkType, LinkType>();
    map.set(LINK_TYPE.REFERENCE, LINK_TYPE.REFERENCE);
    map.set(LINK_TYPE.EXTENDS, LINK_TYPE.EXTENDED_BY);
    map.set(LINK_TYPE.EXTENDED_BY, LINK_TYPE.EXTENDS);
    map.set(LINK_TYPE.REFINES, LINK_TYPE.REFINED_BY);
    map.set(LINK_TYPE.REFINED_BY, LINK_TYPE.REFINES);
    map.set(LINK_TYPE.CONTRADICTS, LINK_TYPE.CONTRADICTED_BY);
    map.set(LINK_TYPE.CONTRADICTED_BY, LINK_TYPE.CONTRADICTS);
    map.set(LINK_TYPE.QUESTIONS, LINK_TYPE.QUESTIONED_BY);
    map.set(LINK_TYPE.QUESTIONED_BY, LINK_TYPE.QUESTIONS);
    map.set(LINK_TYPE.SUPPORTS, LINK_TYPE.SUPPORTED_BY);
    map.set(LINK_TYPE.SUPPORTED_BY, LINK_TYPE.SUPPORTS);
    map.set(LINK_TYPE.RELATED, LINK_TYPE.RELATED);
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
    return isValidLinkTypeValue(linkType);
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
