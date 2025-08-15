/**
 * Space Manager for tracking spaces and resolving their root paths
 * Used by the file protocol to locate files in the correct space
 */

class SpaceManager {
  constructor() {
    this.spaces = new Map(); // spaceId -> { rootPath, name, createdAt }
  }

  /**
   * Register a space with its root path
   * @param {string} spaceId - The space ID
   * @param {string} rootPath - The root path of the space
   * @param {string|null} name - The space name (optional)
   * @param {Date|null} createdAt - When the space was created (optional)
   */
  registerSpace(spaceId, rootPath, name = null, createdAt = null) {
    this.spaces.set(spaceId, {
      rootPath,
      name,
      createdAt: createdAt || new Date()
    });
  }

  /**
   * Unregister a space
   * @param {string} spaceId - The space ID to unregister
   */
  unregisterSpace(spaceId) {
    return this.spaces.delete(spaceId);
  }

  /**
   * Get the root path for a space
   * @param {string} spaceId - The space ID
   * @returns {string|null} The space root path or null if not found
   */
  getSpaceRootPath(spaceId) {
    const space = this.spaces.get(spaceId);
    return space ? space.rootPath : null;
  }

  /**
   * Get all registered spaces
   * @returns {Array<{spaceId: string, rootPath: string, name: string, createdAt: Date}>}
   */
  getAllSpaces() {
    return Array.from(this.spaces.entries()).map(([spaceId, space]) => ({
      spaceId,
      ...space
    }));
  }

  /**
   * Check if a space is registered
   * @param {string} spaceId - The space ID to check
   * @returns {boolean} True if the space is registered
   */
  hasSpace(spaceId) {
    return this.spaces.has(spaceId);
  }

  /**
   * Clear all registered spaces
   */
  clear() {
    this.spaces.clear();
  }
}

// Export a singleton instance
export const spaceManager = new SpaceManager();
