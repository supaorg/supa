export interface FilePreviewConfig {
  canPreview: boolean;
  previewType: 'image' | 'video' | 'pdf' | 'text' | 'code' | 'download';
  gallerySupport: boolean;
  maxPreviewSize?: number; // in bytes
  supportedFormats: string[];
}

export const FILE_PREVIEW_CONFIGS: Record<string, FilePreviewConfig> = {
  // Images - Full preview support
  'image/jpeg': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['jpg', 'jpeg'] },
  'image/png': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['png'] },
  'image/gif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['gif'] },
  'image/webp': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['webp'] },
  'image/svg+xml': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['svg'] },
  'image/avif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['avif'] },
  
  // Videos - Preview with controls
  'video/mp4': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mp4'] },
  'video/webm': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['webm'] },
  'video/ogg': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['ogv'] },
  'video/quicktime': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mov'] },
  
  // Documents - Preview in iframe
  'application/pdf': { canPreview: true, previewType: 'pdf', gallerySupport: true, supportedFormats: ['pdf'] },
  
  // Text files - Preview with syntax highlighting
  'text/plain': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['txt'] },
  'text/markdown': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['md', 'markdown'] },
  'text/html': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['html', 'htm'] },
  'text/css': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['css'] },
  'text/javascript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['js'] },
  'application/json': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['json'] },
  'text/xml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['xml'] },
  'text/csv': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['csv'] },
  
  // Code files - Preview with syntax highlighting
  'application/x-python': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['py'] },
  'text/x-java-source': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['java'] },
  'text/x-c++src': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cpp', 'cc'] },
  'text/x-csrc': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['c'] },
  'text/x-csharp': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cs'] },
  'text/x-php': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['php'] },
  'text/x-ruby': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rb'] },
  'text/x-go': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['go'] },
  'text/x-rust': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rs'] },
  'text/x-swift': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['swift'] },
  'text/x-kotlin': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['kt'] },
  'text/x-scala': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['scala'] },
  'text/x-shellscript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['sh', 'bash'] },
  'text/x-msdos-batch': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['bat'] },
  'application/x-powershell': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ps1'] },
  'text/x-yaml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['yml', 'yaml'] },
  'text/x-toml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['toml'] },
  'text/x-ini': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ini', 'cfg', 'conf'] },
  'text/x-log': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['log'] },
  'text/tab-separated-values': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['tsv'] },
  
  // Non-previewable files - Download only
  'application/zip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['zip'] },
  'application/x-rar-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rar'] },
  'application/x-7z-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['7z'] },
  'application/x-tar': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['tar'] },
  'application/x-gzip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['gz'] },
  'application/x-bzip2': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['bz2'] },
  'application/x-executable': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'app', 'bin'] },
  'application/x-msdownload': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'msi'] },
  'application/x-dmg': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['dmg'] },
  'application/x-deb': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['deb'] },
  'application/x-rpm': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rpm'] },
};

export function getFilePreviewConfig(mimeType: string): FilePreviewConfig {
  return FILE_PREVIEW_CONFIGS[mimeType] || {
    canPreview: false,
    previewType: 'download',
    gallerySupport: false,
    supportedFormats: []
  };
}

export function isPreviewableFile(mimeType: string): boolean {
  return getFilePreviewConfig(mimeType).canPreview;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeTypeFromExtension(extension: string): string {
  for (const [mimeType, config] of Object.entries(FILE_PREVIEW_CONFIGS)) {
    if (config.supportedFormats.includes(extension)) {
      return mimeType;
    }
  }
  return 'application/octet-stream';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('exe') || mimeType.includes('app')) return '⚙️';
  return '📎';
}
