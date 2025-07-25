import { app, screen, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

const WINDOW_STATE_FILE = 'window-state.json';

/**
 * Get the path to the window state file
 */
function getWindowStatePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, WINDOW_STATE_FILE);
}

/**
 * Load saved window state
 */
export function loadWindowState() {
  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(data);
      
      // Validate the state has required properties
      if (state && typeof state.width === 'number' && typeof state.height === 'number') {
        return state;
      }
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  
  // Return default state if loading fails
  return {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
    isFullScreen: false
  };
}

/**
 * Save window state
 * @param {BrowserWindow} window
 */
export function saveWindowState(window) {
  try {
    const bounds = window.getBounds();
    const isMaximized = window.isMaximized();
    const isFullScreen = window.isFullScreen();
    
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized,
      isFullScreen
    };
    
    const statePath = getWindowStatePath();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

/**
 * Get window options with saved state applied
 */
export function getWindowOptionsWithState(defaultOptions = {}) {
  const state = loadWindowState();
  const displays = screen.getAllDisplays();
  
  // Check if the saved position is still valid (window would be visible)
  let isValidPosition = false;
  if (state.x !== undefined && state.y !== undefined) {
    for (const display of displays) {
      const { x, y, width, height } = display.bounds;
      // Check if window position is within this display
      // Also ensure window isn't completely off-screen
      if (state.x >= x && state.x < x + width && 
          state.y >= y && state.y < y + height &&
          state.x + state.width > x && 
          state.y + state.height > y) {
        isValidPosition = true;
        break;
      }
    }
  }
  
  return {
    width: state.width,
    height: state.height,
    x: isValidPosition ? state.x : undefined,
    y: isValidPosition ? state.y : undefined,
    show: false, // Don't show until ready
    ...defaultOptions
  };
} 