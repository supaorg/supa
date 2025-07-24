import { Menu } from 'electron';

export function setupElectronMenu() {
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const template = [
    // On macOS, the first menu is automatically the app menu (shows as "Supa")
    ...(process.platform === 'darwin' ? [/** @type {import('electron').MenuItemConstructorOptions} */ ({
      role: 'appMenu'  // This automatically creates the standard macOS app menu with Quit
    })] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: function () {
            // Add file operations here
            console.log('Open new conversation');
          }
        },
        ({ type: 'separator' }),
        {
          label: 'Open Space',
          accelerator: 'CmdOrCtrl+O',
          click: function () {
            // Add file operations here
            console.log('Open space dialog');
          }
        },
        // Only add Quit to File menu on non-macOS (on macOS it's in the app menu)
        ...(process.platform !== 'darwin' ? [
          /** @type {import('electron').MenuItemConstructorOptions} */ ({ type: 'separator' }),
          /** @type {import('electron').MenuItemConstructorOptions} */ ({ role: 'quit' })
        ] : [])
      ]
    },
    /** @type {import('electron').MenuItemConstructorOptions} */ ({
      role: 'editMenu'  // Standard Edit menu with undo, redo, cut, copy, paste, etc.
    }),
    /** @type {import('electron').MenuItemConstructorOptions} */ ({
      role: 'viewMenu'  // Standard View menu with reload, devtools, zoom, etc.
    }),
    /** @type {import('electron').MenuItemConstructorOptions} */ ({
      role: 'windowMenu'  // Standard Window menu
    }),
    /** @type {import('electron').MenuItemConstructorOptions} */ ({
      role: 'help'  // Standard Help menu with about, etc.
    })
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}