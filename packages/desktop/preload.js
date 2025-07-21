import { contextBridge } from 'electron';
import { electronFs } from './electronFs.js';
import { ipcRenderer } from 'electron';

// Expose the file system API to the renderer process
contextBridge.exposeInMainWorld('electronFs', {
  /**
   * @param {string} path
   */
  readDir: (path) => electronFs.readDir(path),
  
  /**
   * @param {string} path
   */
  exists: (path) => electronFs.exists(path),
  
  /**
   * @param {string} path
   */
  readTextFile: (path) => electronFs.readTextFile(path),
  
  /**
   * @param {string} path
   */
  readTextFileLines: (path) => electronFs.readTextFileLines(path),
  
  /**
   * @param {string} path
   * @param {string} content
   */
  writeTextFile: (path, content) => electronFs.writeTextFile(path, content),
  
  /**
   * @param {string} path
   */
  create: (path) => electronFs.create(path),
  
  /**
   * @param {string} path
   * @param {Object} [options]
   */
  open: (path, options) => electronFs.open(path, options),
  
  /**
   * @param {string} path
   * @param {Object} [options]
   */
  mkdir: (path, options) => electronFs.mkdir(path, options),
  
  /**
   * @param {string} path
   * @param {function(Object): void} callback
   * @param {Object} [options]
   */
  watch: (path, callback, options) => electronFs.watch(path, callback, options)
});

// Expose dialog APIs
contextBridge.exposeInMainWorld('electronDialog', {
  /**
   * Open file/folder picker
   * @param {import('@supa/client/appDialogs').OpenDialogOptions} options
   */
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),

  /**
   * Show save dialog
   * @param {import('@supa/client/appDialogs').SaveDialogOptions} options
   */
  saveDialog: (options) => ipcRenderer.invoke('dialog:save', options)
});

// Also expose environment information
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions
});