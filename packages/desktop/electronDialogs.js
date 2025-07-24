import { contextBridge, ipcRenderer } from 'electron';

export function initElectronDialogs() {
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
}