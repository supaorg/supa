import { createState } from '@sila/client/state/stateUtils';
import type { ResolvedFileInfo } from '@sila/client/utils/fileResolver';

interface GalleryState {
  isOpen: boolean;
  activeFile: ResolvedFileInfo | null;
  files: ResolvedFileInfo[]; // For future multi-item support
  currentIndex: number; // For future multi-item support
}

export const galleryState = createState<GalleryState>({
  isOpen: false,
  activeFile: null,
  files: [],
  currentIndex: 0
});

export function openGallery(resolvedFile: ResolvedFileInfo) {
  galleryState.set({
    isOpen: true,
    activeFile: resolvedFile,
    files: [resolvedFile], // Single file for v1
    currentIndex: 0
  });
}

export function closeGallery() {
  galleryState.set({
    isOpen: false,
    activeFile: null,
    files: [],
    currentIndex: 0
  });
}
