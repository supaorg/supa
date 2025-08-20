/**
 * Metadata stored on a file vertex in the Files tree.
 * Does not include transport-specific fields like dataUrl or sila:// URL.
 */
export interface FileInfo {
  name: string;
  hash: string; // CAS hash
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
}


