import { app, BrowserWindow } from 'electron';
import { setupDialogsInMain } from './dialogs/electronDialogsMain.js';
import { setupElectronMenu } from './electronMenu.js';
import { createWindow } from './electronWindow.js';

// Development mode check
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
/** @type {BrowserWindow | null} */
let mainWindow;

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {

  // Set the app name for menus
  app.setName('Supa');
  mainWindow = createWindow(isDev);
  setupElectronMenu();
  setupDialogsInMain();

  app.on('activate', function () {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(isDev);
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') app.quit();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    event.preventDefault?.();
    console.log('Blocked new window creation to:', url);
    return { action: 'deny' };
  });
}); 