# Window State Management

This Electron app automatically saves and restores window position, size, and state (maximized/fullscreen) between sessions.

## How it works

1. **Saving**: Window state is automatically saved when:
   - Window is resized or moved
   - Window is maximized/unmaximized
   - App is about to quit

2. **Loading**: Window state is restored when the app starts:
   - Position and size are applied during window creation
   - Maximized state is restored after window is shown
   - Invalid positions (e.g., on disconnected displays) are ignored

3. **Storage**: Window state is saved to `window-state.json` in the app's user data directory:
   - macOS: `~/Library/Application Support/Supa/window-state.json`
   - Windows: `%APPDATA%\Supa\window-state.json`
   - Linux: `~/.config/Supa/window-state.json`

## Features

- **Multi-monitor support**: Handles multiple displays and disconnected monitors
- **Fallback defaults**: Uses sensible defaults if saved state is invalid
- **Error handling**: Gracefully handles file read/write errors
- **Screen validation**: Ensures window position is still valid on current display setup

## Files

- `windowState.js`: Core window state management functions
- `electronWindow.js`: Integration with window creation and event handling

## Example saved state

```json
{
  "width": 1200,
  "height": 800,
  "x": 100,
  "y": 50,
  "isMaximized": false,
  "isFullScreen": false
}
``` 