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
   * @param {string} name - The space name (optional)
   * @param {Date} createdAt - When the space was created (optional)
   */
  registerSpace(spaceId, rootPath, name = null, createdAt = null) {
    this.spaces.set(spaceId, {
      rootPath,
      name,
      createdAt: createdAt || new Date()
    });
    console.log(`Registered space: ${spaceId} -> ${rootPath}`);
    console.log(`Total spaces in manager: ${this.spaces.size}`);
    console.log(`All spaces:`, Array.from(this.spaces.keys()));
  }

  /**
   * Unregister a space
   * @param {string} spaceId - The space ID to unregister
   */
  unregisterSpace(spaceId) {
    const removed = this.spaces.delete(spaceId);
    if (removed) {
      console.log(`Unregistered space: ${spaceId}`);
    }
    return removed;
  }

  /**
   * Get the root path for a space
   * @param {string} spaceId - The space ID
   * @returns {string|null} The space root path or null if not found
   */
  getSpaceRootPath(spaceId) {
    console.log(`Looking up space: ${spaceId}`);
    console.log(`Total spaces in manager: ${this.spaces.size}`);
    console.log(`Available space IDs:`, Array.from(this.spaces.keys()));
    const space = this.spaces.get(spaceId);
    console.log(`Space found:`, !!space);
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
    console.log('Cleared all registered spaces');
  }
}

// Export a singleton instance
export const spaceManager = new SpaceManager();
