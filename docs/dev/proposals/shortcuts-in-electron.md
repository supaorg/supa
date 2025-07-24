# Shortcuts in Electron Proposal

## Problem Statement

Our Supa app needs a unified shortcut system where:
- Users can customize shortcuts in the UI (renderer process)
- Menu accelerators reflect current shortcuts (main process) 
- Web-based shortcuts work throughout the app (renderer process)
- Changes are synchronized between both processes

## Architecture Overview

```
┌─────────────────┐    IPC     ┌─────────────────┐
│ Renderer Process│◄──────────►│ Main Process    │
│ (Svelte App)    │            │ (Electron)      │
├─────────────────┤            ├─────────────────┤
│ • Shortcuts UI  │            │ • Menu Creation │
│ • Web Shortcuts │            │ • Menu Updates  │
│ • Settings      │            │ • Global Hotkeys│
└─────────────────┘            └─────────────────┘
```

## Data Flow

1. **Initialization**: Main process requests current shortcuts from renderer
2. **User Changes**: Renderer updates shortcuts via settings UI
3. **Synchronization**: Renderer sends updated shortcuts to main process
4. **Menu Update**: Main process rebuilds menu with new accelerators

## Implementation Approach

### 1. Shortcuts Store (Renderer)

```typescript
// lib/state/shortcuts.svelte.ts
export interface ShortcutMap {
  // Menu shortcuts (will become Electron accelerators)
  newFile: string;
  openFile: string;
  save: string;
  
  // Web-only shortcuts
  commandPalette: string;
  quickSwitch: string;
  toggleSidebar: string;
}

let shortcuts = $state<ShortcutMap>({
  newFile: 'CmdOrCtrl+N',
  openFile: 'CmdOrCtrl+O',
  save: 'CmdOrCtrl+S',
  commandPalette: 'CmdOrCtrl+K',
  quickSwitch: 'CmdOrCtrl+P',
  toggleSidebar: 'CmdOrCtrl+B'
});

export function updateShortcuts(newShortcuts: Partial<ShortcutMap>) {
  shortcuts = { ...shortcuts, ...newShortcuts };
  
  // Send to main process for menu updates
  if (window.electronAPI) {
    window.electronAPI.updateShortcuts(shortcuts);
  }
  
  // Persist to storage
  localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
}
```

### 2. IPC Communication

```typescript
// electronDialogsWrapper.ts (extend existing)
export interface ElectronAPI {
  // ... existing methods
  updateShortcuts: (shortcuts: ShortcutMap) => void;
  requestShortcuts: () => Promise<ShortcutMap>;
}
```

```javascript
// preload.js (extend existing)
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods
  updateShortcuts: (shortcuts) => ipcRenderer.send('update-shortcuts', shortcuts),
  requestShortcuts: () => ipcRenderer.invoke('request-shortcuts')
});
```

### 3. Main Process Handler

```javascript
// main.js
import { ipcMain } from 'electron';

let currentShortcuts = {
  newFile: 'CmdOrCtrl+N',
  openFile: 'CmdOrCtrl+O',
  save: 'CmdOrCtrl+S'
  // ... defaults
};

// Handle shortcut updates from renderer
ipcMain.on('update-shortcuts', (event, shortcuts) => {
  currentShortcuts = { ...currentShortcuts, ...shortcuts };
  
  // Rebuild menu with new shortcuts
  createElectronMenu(currentShortcuts);
  
  // Optionally persist to main process storage
  // store.set('shortcuts', currentShortcuts);
});

// Handle shortcut requests from renderer
ipcMain.handle('request-shortcuts', () => {
  return currentShortcuts;
});
```

### 4. Menu Integration

```javascript
// electronMenu.js
export function createElectronMenu(shortcuts = {}) {
  const template = [
    // ... existing menu structure
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: shortcuts.newFile || 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-action', 'new-file')
        },
        {
          label: 'Open',
          accelerator: shortcuts.openFile || 'CmdOrCtrl+O', 
          click: () => mainWindow.webContents.send('menu-action', 'open-file')
        }
        // ...
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

## Integration Points

### Settings UI Component
```svelte
<!-- ShortcutSettings.svelte -->
<script>
  import { shortcuts, updateShortcuts } from '$lib/state/shortcuts.svelte.ts';
  
  function handleShortcutChange(action: string, newShortcut: string) {
    updateShortcuts({ [action]: newShortcut });
  }
</script>

<div class="shortcuts-settings">
  <ShortcutInput 
    label="New File" 
    value={shortcuts.newFile}
    on:change={(e) => handleShortcutChange('newFile', e.detail)}
  />
  <!-- More shortcut inputs... -->
</div>
```

### Web Shortcut Handler
```typescript
// lib/shortcuts/webShortcuts.ts
export function setupWebShortcuts(shortcuts: ShortcutMap) {
  document.addEventListener('keydown', (e) => {
    const pressed = formatKeyCombo(e);
    
    if (pressed === shortcuts.commandPalette) {
      openCommandPalette();
    }
    
    if (pressed === shortcuts.quickSwitch) {
      openQuickSwitch();
    }
    
    // Handle other web shortcuts...
  });
}
```

## Considerations

### Performance
- Menu rebuilding is fast (~1ms) but avoid excessive updates
- Debounce shortcut changes if user is rapidly editing

### Persistence
- **Renderer**: Use localStorage or IndexedDB for user preferences
- **Main**: Use electron-store or file system for system defaults
- Consider sync mechanism if shortcuts should roam across devices

### Validation
- Validate shortcut format before sending to main process
- Check for conflicts with system shortcuts
- Provide user feedback for invalid combinations

### Platform Differences
- Handle `Cmd` vs `Ctrl` automatically in shortcut display
- Some shortcuts may be platform-specific
- Global shortcuts need special handling

## Migration Path

1. **Phase 1**: Implement basic IPC communication
2. **Phase 2**: Add shortcut customization UI  
3. **Phase 3**: Enhance with conflict detection and validation
4. **Phase 4**: Add global shortcuts and advanced features

## Alternative Approaches

### Option A: Main Process as Source of Truth
- Store all shortcuts in main process
- Renderer requests shortcuts on startup
- More complex but better for global shortcuts

### Option B: Shared Configuration File
- Both processes read from same config file
- Use file watching for synchronization
- Simpler but less flexible

### Option C: Two-Way Sync
- Both processes can initiate changes
- More complex conflict resolution needed
- Best for advanced scenarios

## Recommendation

Start with **renderer-driven approach** (outlined above) because:
- Most shortcut changes happen in UI
- Simpler to implement and debug
- Easy to extend later
- Follows established patterns in Electron apps 