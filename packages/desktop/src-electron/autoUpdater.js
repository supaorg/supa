import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { dialog, BrowserWindow } from 'electron';

// Standard auto-updater setup - this is the usual way
export function setupAutoUpdater() {
  // Configure auto updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Set up event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (/** @type {any} */ info) => {
    console.log('Update available:', info);
    showUpdateDialog(info);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Update not available');
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto updater error:', err);
  });

  autoUpdater.on('update-downloaded', (/** @type {any} */ info) => {
    console.log('Update downloaded:', info);
    showInstallDialog();
  });

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 5000);
}

function showUpdateDialog(/** @type {any} */ info) {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    detail: 'Would you like to download and install it now?',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
}

function showInstallDialog() {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'The update has been downloaded and is ready to install.',
    detail: 'The app will restart to install the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
}

// Manual update check function
export function checkForUpdates() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping update check in development mode');
    return;
  }
  autoUpdater.checkForUpdates();
} 