import { heicConverter } from './heicConverter';

// Supported text file types
const SUPPORTED_TEXT_TYPES = {
  // Plain text
  'text/plain': ['.txt', '.log', '.csv'],
  
  // Markup and documentation
  'text/markdown': ['.md', '.markdown'],
  'text/html': ['.html', '.htm'],
  'text/css': ['.css'],
  
  // Code files
  'text/javascript': ['.js', '.mjs'],
  'text/typescript': ['.ts', '.tsx'],
  'text/x-python': ['.py'],
  'text/x-java': ['.java'],
  'text/x-c': ['.c', '.cpp', '.h', '.hpp'],
  'text/x-csharp': ['.cs'],
  'text/x-php': ['.php'],
  'text/x-ruby': ['.rb'],
  'text/x-go': ['.go'],
  'text/x-rust': ['.rs'],
  'text/x-swift': ['.swift'],
  'text/x-kotlin': ['.kt'],
  'text/x-scala': ['.scala'],
  
  // Data formats
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  
  // Configuration files
  'text/x-yaml': ['.yml', '.yaml'],
  'text/x-toml': ['.toml'],
  'text/x-ini': ['.ini', '.cfg', '.conf'],
  
  // Shell scripts
  'text/x-shellscript': ['.sh', '.bash', '.zsh', '.fish'],
  'text/x-batch': ['.bat', '.cmd'],
  'text/x-powershell': ['.ps1']
};

export interface TextFileMetadata {
  lineCount: number;
  charCount: number;
  wordCount: number;
  hasContent: boolean;
  language: string;
  encoding: string;
}

// File Processing Pipeline Functions
export async function processFileForUpload(file: File): Promise<File> {
  // Check if it's a HEIC file
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      // Convert HEIC to JPEG
      const convertedBlob = await heicConverter.convert(file);
      
      // Change the extension to reflect the conversion
      const newName = file.name.replace(/\.heic$/i, '.jpg');
      
      // Create new File object with converted data and updated name
      return new File([convertedBlob], newName, {
        type: 'image/jpeg',
        lastModified: file.lastModified
      });
    } catch (error) {
      console.warn(`HEIC conversion failed for ${file.name}, skipping:`, error);
      throw error; // Skip this file
    }
  }
  
  // Return original file if no conversion needed
  return file;
}

export async function processTextFileForUpload(file: File): Promise<File> {
  // Check if it's a text file using content-based detection
  if (!(await isTextFile(file))) {
    throw new Error(`File does not appear to be a text file: ${file.name}`);
  }
  
  // Return original file if no conversion needed
  return file;
}

export async function optimizeImageSize(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(await toDataUrl(file));
    if (!dimensions) return file;
    
    const { width, height } = dimensions;
    const maxSize = 2048;
    
    // Check if resizing is needed
    if (width <= maxSize && height <= maxSize) {
      return file; // No resizing needed
    }
    
    // Calculate new dimensions maintaining aspect ratio
    const ratio = Math.min(maxSize / width, maxSize / height);
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);
    
    // Resize image
    const resizedBlob = await resizeImage(file, newWidth, newHeight, 0.85);
    
    // Create new File object with resized data
    return new File([resizedBlob], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
  } catch (error) {
    console.warn(`Image resizing failed for ${file.name}, using original:`, error);
    return file; // Fallback to original
  }
}

export async function optimizeTextFile(file: File): Promise<File> {
  // Only process text files
  if (!(await isTextFile(file))) {
    return file;
  }
  
  // For now, no optimizations needed - preserve original content exactly
  // This function exists to maintain pipeline consistency with image processing
  return file;
}

export async function isTextFile(file: File): Promise<boolean> {
  // For files with binary MIME types, always check content first
  if (file.type.startsWith('image/') || 
      file.type.startsWith('video/') || 
      file.type.startsWith('audio/')) {
    return false;
  }
  
  // For files with text MIME types, still verify content for security
  if (file.type.startsWith('text/') || 
      file.type === 'application/json' || 
      file.type === 'application/xml') {
    
    // Read first 1KB of the file to verify it's actually text
    const sample = await readFileSample(file, 1024);
    return isTextContent(sample);
  }
  
  // For unknown MIME types or application types, check file content
  if (file.type.startsWith('application/') || file.type === '') {
    // Read first 1KB of the file to check if it's text
    const sample = await readFileSample(file, 1024);
    const isText = isTextContent(sample);
    
    // If content analysis says it's not text, trust that
    if (!isText) {
      return false;
    }
    
    return true;
  }
  
  // Fallback to file extension check for edge cases
  const extension = file.name.toLowerCase().split('.').pop();
  return Object.values(SUPPORTED_TEXT_TYPES).flat().includes(`.${extension}`);
}

export async function readFileSample(file: File, maxBytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // Check if we're in a Node.js environment
    if (typeof window === 'undefined') {
      // Node.js environment - use file.arrayBuffer()
      file.arrayBuffer().then(buffer => {
        const bytes = new Uint8Array(buffer);
        resolve(bytes.slice(0, Math.min(maxBytes, bytes.length)));
      }).catch(reject);
    } else {
      // Browser environment - use FileReader
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        // Return only the first maxBytes
        resolve(bytes.slice(0, Math.min(maxBytes, bytes.length)));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    }
  });
}

export function isTextContent(bytes: Uint8Array): boolean {
  // Handle empty content
  if (bytes.length === 0) {
    return true;
  }
  
  // Check for null bytes (common in binary files)
  if (bytes.includes(0)) {
    return false;
  }
  
  // Check for common binary file signatures
  const signatures = [
    [0xFF, 0xD8, 0xFF], // JPEG
    [0x89, 0x50, 0x4E, 0x47], // PNG
    [0x47, 0x49, 0x46], // GIF
    [0x52, 0x49, 0x46, 0x46], // WAV, AVI, etc.
    [0x25, 0x50, 0x44, 0x46], // PDF
    [0x50, 0x4B, 0x03, 0x04], // ZIP
    [0x50, 0x4B, 0x05, 0x06], // ZIP (empty)
    [0x50, 0x4B, 0x07, 0x08], // ZIP (spanned)
    [0x1F, 0x8B, 0x08], // GZIP
    [0x7F, 0x45, 0x4C, 0x46], // ELF
    [0x4D, 0x5A], // EXE/DLL
    [0xFE, 0xED, 0xFA], // Mach-O
    [0xCF, 0xFA, 0xED, 0xFE], // Mach-O (reverse)
  ];
  
  for (const sig of signatures) {
    if (bytes.length >= sig.length && 
        sig.every((byte, index) => bytes[index] === byte)) {
      return false;
    }
  }
  
  // Check if content is mostly printable ASCII/UTF-8
  let printableCount = 0;
  let totalCount = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    totalCount++;
    
    // Printable ASCII (32-126) or common whitespace (9, 10, 13)
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableCount++;
    }
    // UTF-8 continuation bytes (128-191) or start bytes (192-247)
    else if (byte >= 128 && byte <= 247) {
      printableCount++;
    }
  }
  
  // Consider it text if at least 90% of bytes are printable
  const textRatio = printableCount / totalCount;
  return textRatio >= 0.9;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if we're in a Node.js environment
    if (typeof window === 'undefined') {
      // Node.js environment - use file.text()
      file.text().then(resolve).catch(reject);
    } else {
      // Browser environment - use FileReader
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    }
  });
}

export function extractTextFileMetadata(file: File, content: string): TextFileMetadata {
  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    lineCount,
    charCount,
    wordCount,
    hasContent: content.length > 0,
    language: detectLanguage(file.name, content),
    encoding: 'utf-8'
  };
}

export function detectLanguage(fileName: string, content: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  // Simple extension-based detection
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'mjs': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'cc': 'C++',
    'h': 'C',
    'hpp': 'C++',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'sh': 'Shell',
    'bash': 'Shell',
    'zsh': 'Shell',
    'fish': 'Shell',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'json': 'JSON',
    'xml': 'XML',
    'html': 'HTML',
    'htm': 'HTML',
    'css': 'CSS',
    'yaml': 'YAML',
    'yml': 'YAML',
    'toml': 'TOML',
    'csv': 'CSV',
    'tsv': 'CSV',
    'txt': 'Plain Text',
    'log': 'Plain Text',
    'ini': 'INI',
    'cfg': 'INI',
    'conf': 'INI',
    'bat': 'Batch',
    'cmd': 'Batch',
    'ps1': 'PowerShell'
  };
  
  return languageMap[extension || ''] || 'Unknown';
}

export async function resizeImage(file: File, width: number, height: number, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(file);
  });
}

export function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}