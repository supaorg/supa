import type { ResolvedFileInfo } from '../utils/fileResolver';

/**
 * Gallery - File Preview Gallery Manager
 * 
 * This class handles the file gallery state and operations.
 * It uses Svelte's $state for reactivity.
 */
export class Gallery {
  isOpen: boolean = $state(false);
  activeFile: ResolvedFileInfo | null = $state(null);
  files: ResolvedFileInfo[] = $state([]); // For future multi-item support
  currentIndex: number = $state(0); // For future multi-item support

  /**
   * Open the gallery with a single file
   */
  open(resolvedFile: ResolvedFileInfo) {
    this.isOpen = true;
    this.activeFile = resolvedFile;
    this.files = [resolvedFile]; // Single file for v1
    this.currentIndex = 0;
  }

  /**
   * Close the gallery
   */
  close() {
    this.isOpen = false;
    this.activeFile = null;
    this.files = [];
    this.currentIndex = 0;
  }

  /**
   * Open gallery with multiple files (for future use)
   */
  openMultiple(files: ResolvedFileInfo[], initialIndex: number = 0) {
    this.isOpen = true;
    this.files = files;
    this.currentIndex = initialIndex;
    this.activeFile = files[initialIndex] || null;
  }

  /**
   * Navigate to next file (for future use)
   */
  next() {
    if (this.files.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.files.length;
      this.activeFile = this.files[this.currentIndex];
    }
  }

  /**
   * Navigate to previous file (for future use)
   */
  previous() {
    if (this.files.length > 1) {
      this.currentIndex = this.currentIndex === 0 
        ? this.files.length - 1 
        : this.currentIndex - 1;
      this.activeFile = this.files[this.currentIndex];
    }
  }
}

// Setup function that creates and returns a Gallery instance
export function setupGallery(): Gallery {
  return new Gallery();
}
