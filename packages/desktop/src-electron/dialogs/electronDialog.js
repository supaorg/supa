import { contextBridge, ipcRenderer } from 'electron';
import { ipcOpen, ipcSave } from './electronDialogIpc.js';

/**
 * Setup dialogs in the preloader where we expose the dialogs to the client
 * via the contextBridge
 */
export function setupDialogsInPreloader() {
  // Expose dialog APIs
  contextBridge.exposeInMainWorld('electronDialog', {
    /**
     * Open file/folder picker
     * @param {import('@supa/client/appDialogs').OpenDialogOptions} options
     */
    openDialog: (options) => ipcRenderer.invoke(ipcOpen, options),

    /**
     * Show save dialog
     * @param {import('@supa/client/appDialogs').SaveDialogOptions} options
     */
    saveDialog: (options) => ipcRenderer.invoke(ipcSave, options)
  });
}