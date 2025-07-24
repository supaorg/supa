import { contextBridge, ipcRenderer } from 'electron';
import { ipcOpen, ipcSave, ipcShowInfo, ipcShowWarning, ipcShowError, ipcShowQuestion, ipcShowErrorBox } from './electronDialogIpc.js';

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
    saveDialog: (options) => ipcRenderer.invoke(ipcSave, options),

    /**
     * Show info message dialog
     * @param {import('@supa/client/appDialogs').MessageDialogOptions} options
     */
    showInfo: (options) => ipcRenderer.invoke(ipcShowInfo, options),

    /**
     * Show warning message dialog
     * @param {import('@supa/client/appDialogs').MessageDialogOptions} options
     */
    showWarning: (options) => ipcRenderer.invoke(ipcShowWarning, options),

    /**
     * Show error message dialog
     * @param {import('@supa/client/appDialogs').MessageDialogOptions} options
     */
    showError: (options) => ipcRenderer.invoke(ipcShowError, options),

    /**
     * Show question message dialog
     * @param {import('@supa/client/appDialogs').MessageDialogOptions} options
     */
    showQuestion: (options) => ipcRenderer.invoke(ipcShowQuestion, options),

    /**
     * Show simple error box (non-blocking)
     * @param {string} title
     * @param {string} content
     */
    showErrorBox: (title, content) => ipcRenderer.invoke(ipcShowErrorBox, title, content)
  });
}