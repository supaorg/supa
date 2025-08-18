import type { ResolvedFileInfo } from '@sila/client/utils/fileResolver';

export class GalleryState {
  isOpen: boolean = $state(false);
  activeFile: ResolvedFileInfo | null = $state(null);
  files: ResolvedFileInfo[] = $state([]); // For future multi-item support
  currentIndex: number = $state(0); // For future multi-item support

  openGallery(resolvedFile: ResolvedFileInfo) {
    this.isOpen = true;
    this.activeFile = resolvedFile;
    this.files = [resolvedFile]; // Single file for v1
    this.currentIndex = 0;
  }

  closeGallery() {
    this.isOpen = false;
    this.activeFile = null;
    this.files = [];
    this.currentIndex = 0;
  }
}

export const galleryState = new GalleryState();
