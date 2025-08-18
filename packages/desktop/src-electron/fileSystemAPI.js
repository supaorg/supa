import { contextBridge, ipcRenderer } from 'electron';

/**
 * Setup file system API for the renderer process
 * Provides access to the custom file protocol and space management
 */
export function setupFileSystemAPI() {
  contextBridge.exposeInMainWorld('electronFileSystem', {
    /**
     * Get a file URL for the custom protocol
     * @param {string} spaceId - The space ID
     * @param {string} hash - The file hash
     * @param {string} mimeType - The MIME type (optional)
     * @returns {string} The file URL
     */
    getFileUrl: (spaceId, hash, mimeType, name) => {
      const url = `sila://spaces/${spaceId}/files/${hash}`;
      const params = [];
      if (mimeType) params.push(`type=${encodeURIComponent(mimeType)}`);
      if (name) params.push(`name=${encodeURIComponent(name)}`);
      return params.length ? `${url}?${params.join('&')}` : url;
    },

    /**
     * Register a space with the file system
     * @param {string} spaceId - The space ID
     * @param {string} rootPath - The space root path
     * @param {string} name - The space name (optional)
     * @param {Date} createdAt - When the space was created (optional)
     */
    registerSpace: (spaceId, rootPath, name, createdAt) => {
      ipcRenderer.invoke('register-space', { spaceId, rootPath, name, createdAt });
    },

    /**
     * Unregister a space
     * @param {string} spaceId - The space ID to unregister
     * @returns {Promise<boolean>} True if the space was unregistered
     */
    unregisterSpace: (spaceId) => {
      return ipcRenderer.invoke('unregister-space', spaceId);
    },

    /**
     * Check if a space is registered
     * @param {string} spaceId - The space ID to check
     * @returns {Promise<boolean>} True if the space is registered
     */
    hasSpace: (spaceId) => {
      return ipcRenderer.invoke('has-space', spaceId);
    },

    /**
     * Get all registered spaces
     * @returns {Promise<Array<{spaceId: string, rootPath: string, name: string, createdAt: Date}>>}
     */
    getAllSpaces: () => {
      return ipcRenderer.invoke('get-all-spaces');
    }
  });
}
