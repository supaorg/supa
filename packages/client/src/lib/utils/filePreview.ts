export interface FilePreviewConfig {
  canPreview: boolean;
  previewType: 'image' | 'video' | 'pdf' | 'text' | 'code' | 'download';
  gallerySupport: boolean;
  maxPreviewSize?: number; // in bytes
  supportedFormats: string[];
  displayName: string; // User-friendly format name
  icon: string; // Emoji or icon for the file type
}

export const FILE_PREVIEW_CONFIGS: Record<string, FilePreviewConfig> = {
  // Images - Full preview support
  'image/jpeg': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['jpg', 'jpeg'], displayName: 'JPEG', icon: '🖼️' },
  'image/png': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['png'], displayName: 'PNG', icon: '🖼️' },
  'image/gif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['gif'], displayName: 'GIF', icon: '🖼️' },
  'image/webp': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['webp'], displayName: 'WebP', icon: '🖼️' },
  'image/svg+xml': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['svg'], displayName: 'SVG', icon: '🖼️' },
  'image/avif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['avif'], displayName: 'AVIF', icon: '🖼️' },
  
  // Videos - Preview with controls
  'video/mp4': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mp4'], displayName: 'MP4', icon: '🎥' },
  'video/webm': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['webm'], displayName: 'WebM', icon: '🎥' },
  'video/ogg': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['ogv'], displayName: 'OGG', icon: '🎥' },
  'video/quicktime': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mov'], displayName: 'MOV', icon: '🎥' },
  
  // Documents - Preview in iframe
  'application/pdf': { canPreview: true, previewType: 'pdf', gallerySupport: true, supportedFormats: ['pdf'], displayName: 'PDF', icon: '📄' },
  
  // Text files - Preview with syntax highlighting
  'text/plain': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['txt'], displayName: 'Text', icon: '📄' },
  'text/markdown': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['md', 'markdown'], displayName: 'Markdown', icon: '📝' },
  'text/html': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['html', 'htm'], displayName: 'HTML', icon: '🌐' },
  'text/css': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['css'], displayName: 'CSS', icon: '🎨' },
  'text/javascript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['js'], displayName: 'JavaScript', icon: '⚡' },
  'application/json': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['json'], displayName: 'JSON', icon: '📋' },
  'text/xml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['xml'], displayName: 'XML', icon: '📋' },
  'text/csv': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['csv'], displayName: 'CSV', icon: '📊' },
  
  // Code files - Preview with syntax highlighting
  'application/x-python': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['py'], displayName: 'Python', icon: '🐍' },
  'text/x-java-source': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['java'], displayName: 'Java', icon: '☕' },
  'text/x-c++src': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cpp', 'cc'], displayName: 'C++', icon: '⚙️' },
  'text/x-csrc': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['c'], displayName: 'C', icon: '⚙️' },
  'text/x-csharp': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cs'], displayName: 'C#', icon: '🔷' },
  'text/x-php': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['php'], displayName: 'PHP', icon: '🐘' },
  'text/x-ruby': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rb'], displayName: 'Ruby', icon: '💎' },
  'text/x-go': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['go'], displayName: 'Go', icon: '🐹' },
  'text/x-rust': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rs'], displayName: 'Rust', icon: '🦀' },
  'text/x-swift': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['swift'], displayName: 'Swift', icon: '🍎' },
  'text/x-kotlin': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['kt'], displayName: 'Kotlin', icon: '🔶' },
  'text/x-scala': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['scala'], displayName: 'Scala', icon: '🔶' },
  'text/x-shellscript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['sh', 'bash'], displayName: 'Shell', icon: '💻' },
  'text/x-msdos-batch': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['bat'], displayName: 'Batch', icon: '💻' },
  'application/x-powershell': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ps1'], displayName: 'PowerShell', icon: '💻' },
  'text/x-yaml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['yml', 'yaml'], displayName: 'YAML', icon: '📋' },
  'text/x-toml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['toml'], displayName: 'TOML', icon: '📋' },
  'text/x-ini': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ini', 'cfg', 'conf'], displayName: 'INI', icon: '⚙️' },
  'text/x-log': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['log'], displayName: 'Log', icon: '📋' },
  'text/tab-separated-values': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['tsv'], displayName: 'TSV', icon: '📊' },
  
  // Non-previewable files - Download only
  'application/zip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['zip'], displayName: 'ZIP', icon: '📦' },
  'application/x-rar-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rar'], displayName: 'RAR', icon: '📦' },
  'application/x-7z-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['7z'], displayName: '7-Zip', icon: '📦' },
  'application/x-tar': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['tar'], displayName: 'TAR', icon: '📦' },
  'application/x-gzip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['gz'], displayName: 'GZIP', icon: '📦' },
  'application/x-bzip2': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['bz2'], displayName: 'BZIP2', icon: '📦' },
  'application/x-executable': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'app', 'bin'], displayName: 'Executable', icon: '⚙️' },
  'application/x-msdownload': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'msi'], displayName: 'Windows Installer', icon: '⚙️' },
  'application/x-dmg': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['dmg'], displayName: 'DMG', icon: '🍎' },
  'application/x-deb': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['deb'], displayName: 'DEB', icon: '🐧' },
  'application/x-rpm': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rpm'], displayName: 'RPM', icon: '🐧' },
};

export const defaultDownloadConfig: FilePreviewConfig = {
  canPreview: false,
  previewType: 'download',
  gallerySupport: false,
  supportedFormats: [],
  displayName: 'File',
  icon: '📎'
};

export function getFilePreviewConfig(mimeType?: string): FilePreviewConfig {
  if (!mimeType) {
    return defaultDownloadConfig;
  }

  return FILE_PREVIEW_CONFIGS[mimeType] || defaultDownloadConfig;
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
