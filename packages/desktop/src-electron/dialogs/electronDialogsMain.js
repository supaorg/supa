import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ipcOpen, ipcSave } from './electronDialogIpc.js';

/**
 * Setup dialogs in the main process where we handle the dialogs
 * via the ipcMain
 */
export function setupDialogsInMain() {
  // IPC handlers for dialogs
  ipcMain.handle(ipcOpen, async (event, options) => {
    const browserWin = BrowserWindow.fromWebContents(event.sender);
    const properties = [options?.directory ? 'openDirectory' : 'openFile'];
    if (options?.multiple) properties.push('multiSelections');
    properties.push('createDirectory');

    /** @type {import('electron').OpenDialogOptions} */
    const params = {
      title: options?.title,
      // @ts-ignore: runtime valid values
      properties,
      filters: options?.filters
    };

    // @ts-ignore - bypass TS type mismatch for properties array
    const result = browserWin
      ? await dialog.showOpenDialog(browserWin, /** @type any */(params))
      : await dialog.showOpenDialog(/** @type any */(params));
    if (result.canceled) return null;
    return options?.multiple ? result.filePaths : result.filePaths[0];
  });

  ipcMain.handle(ipcSave, async (event, options) => {
    const browserWin = BrowserWindow.fromWebContents(event.sender);
    /** @type {import('electron').SaveDialogOptions} */
    const params = {
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters
    };

    // @ts-ignore
    const result = browserWin
      ? await dialog.showSaveDialog(browserWin, /** @type any */(params))
      : await dialog.showSaveDialog(/** @type any */(params));
    if (result.canceled) return null;
    return result.filePath;
  });
}