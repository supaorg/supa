import { app, BrowserWindow, Menu, shell } from 'electron';
import { ipcMain, dialog } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Development mode check
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

const serveURL = serve({ directory: '.' });

// Note: SvelteKit provides HMR for renderer process changes
// Main process changes (this file) require manual restart

// Keep a global reference of the window object
/** @type {BrowserWindow | null} */
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // titleBarStyle: 'default', // Use native title bar with standard controls (this is the default)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: !isDev, // Needed for SvelteKit in development
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready
  });

  // Load the appropriate URL/file based on environment
  if (isDev) {
    // Development: load from SvelteKit dev server
    mainWindow.loadURL('http://localhost:6969');
  } else {
    // Production: load built SvelteKit files
    serveURL(mainWindow);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      console.error("mainWindow is not set");
    }
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in the default browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

function createMenu() {
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function () {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: function () {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: function () {
            if (mainWindow) {
              mainWindow.webContents.setZoomLevel(0);
            }
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: function () {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: function () {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: function () {
            // Add file operations here
            console.log('New file action');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: function () {
            // Add file operations here
            console.log('Open file action');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: function () {
            app.quit();
          }
        },
        
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  createWindow();
  createMenu();

  // IPC handlers for dialogs
  ipcMain.handle('dialog:open', async (event, options) => {
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
      ? await dialog.showOpenDialog(browserWin, /** @type any */ (params))
      : await dialog.showOpenDialog(/** @type any */ (params));
    if (result.canceled) return null;
    return options?.multiple ? result.filePaths : result.filePaths[0];
  });

  ipcMain.handle('dialog:save', async (event, options) => {
    const browserWin = BrowserWindow.fromWebContents(event.sender);
    /** @type {import('electron').SaveDialogOptions} */
    const params = {
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters
    };

    // @ts-ignore
    const result = browserWin
      ? await dialog.showSaveDialog(browserWin, /** @type any */ (params))
      : await dialog.showSaveDialog(/** @type any */ (params));
    if (result.canceled) return null;
    return result.filePath;
  });

  app.on('activate', function () {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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