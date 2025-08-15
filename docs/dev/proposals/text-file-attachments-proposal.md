# Text File Attachments Proposal for Sila Chat

## Executive Summary

This proposal outlines the implementation of text file attachments in Sila's chat system, allowing users to attach text files (`.txt`, `.md`, `.json`, `.csv`, `.js`, `.ts`, `.py`, etc.) to chat messages. The text content will be extracted and included in the message sent to AI models, providing context for more informed responses.

## Current State Analysis

### Existing Image Attachment System
- **File Processing Pipeline**: HEIC conversion, image optimization, data URL generation
- **Storage**: Content-Addressed Storage (CAS) with file references in messages
- **AI Integration**: Vision-capable models receive base64-encoded images, others get descriptive text
- **UI**: File picker restricted to `accept="image/*"`, preview thumbnails in message form

### Current Limitations
- Only image files are supported for attachments
- No text file processing or content extraction
- File picker UI doesn't allow text file selection
- AI models can't access text file content

## Proposed Solution

### 1. File Type Support

#### Supported Text File Types
```typescript
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
```

### 2. Text File Processing Pipeline

#### Content-Based File Detection
Instead of relying solely on file extensions, we use content-based detection to identify text files:

1. **MIME Type Check**: First check for known text MIME types
2. **Binary Signature Detection**: Check for common binary file signatures (JPEG, PNG, ZIP, etc.)
3. **Content Analysis**: Analyze the first 1KB of the file to determine if it contains mostly printable text
4. **Extension Fallback**: Use file extension as a final fallback for edge cases

This approach allows us to:
- Handle files with incorrect extensions (e.g., `.txt` files that are actually images)
- Support files without extensions
- Detect text files even when MIME types are incorrect
- Provide more accurate file type detection

#### Conversion Pipeline Pattern
Following the existing image conversion pipeline pattern, text files go through a similar two-step process:

1. **`processTextFileForUpload()`**: Validates file type using content-based detection
2. **`optimizeTextFile()`**: Handles any text-specific optimizations (currently none, but keeps pipeline consistent)

This maintains consistency with the existing `processFileForUpload()` and `optimizeImageSize()` pattern.

#### New Processing Functions
```typescript
// packages/client/src/lib/utils/fileProcessing.ts

export async function processTextFileForUpload(file: File): Promise<File> {
  // Check if it's a text file using content-based detection
  if (!(await isTextFile(file))) {
    throw new Error(`File does not appear to be a text file: ${file.name}`);
  }
  
  // Return original file if no conversion needed
  return file;
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
  // Check MIME type first for known text types
  if (file.type.startsWith('text/') || 
      file.type === 'application/json' || 
      file.type === 'application/xml') {
    return true;
  }
  
  // For unknown MIME types or binary MIME types, check file content
  if (file.type.startsWith('application/') || 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') || 
      file.type.startsWith('audio/') ||
      file.type === '') {
    
    // Read first 1KB of the file to check if it's text
    const sample = await readFileSample(file, 1024);
    return isTextContent(sample);
  }
  
  // Fallback to file extension check for edge cases
  const extension = file.name.toLowerCase().split('.').pop();
  return Object.values(SUPPORTED_TEXT_TYPES).flat().includes(`.${extension}`);
}

export async function readFileSample(file: File, maxBytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      // Return only the first maxBytes
      resolve(bytes.slice(0, Math.min(maxBytes, bytes.length)));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function isTextContent(bytes: Uint8Array): boolean {
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
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

// Note: No content normalization is performed - original file content is preserved exactly as-is
// This ensures that all whitespace, line endings, and formatting are maintained exactly as intended
// 
// Rationale for no normalization:
// - Line endings (CRLF vs LF) may be significant for certain file types
// - Whitespace and indentation are often critical for code files
// - BOM characters may be intentional in some contexts
// - Users expect their files to be preserved exactly as uploaded

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
    'ts': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'sh': 'Shell',
    'md': 'Markdown',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'toml': 'TOML',
    'csv': 'CSV',
    'txt': 'Plain Text'
  };
  
  return languageMap[extension || ''] || 'Unknown';
}
```

### 3. UI Updates

#### File Picker Enhancement
```svelte
<!-- packages/client/src/lib/comps/forms/SendMessageForm.svelte -->

<!-- Update file input to accept text files -->
<input 
  type="file" 
  accept="image/*,.txt,.md,.json,.csv,.js,.ts,.py,.java,.c,.cpp,.h,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bat,.ps1,.yml,.yaml,.toml,.ini,.cfg,.conf,.xml,.html,.css,.log,.tsv" 
  multiple 
  class="hidden" 
  bind:this={fileInputEl} 
  onchange={onFilesSelected} 
/>

<!-- Update attachment preview to show text file info -->
{#if att.kind === 'text' && att.metadata}
  <div class="text-xs opacity-70 border rounded px-2 py-1">
    <div class="font-medium">{att.name}</div>
    <div class="text-xs opacity-60">
      {att.metadata.language} • {att.metadata.lineCount} lines • {att.metadata.wordCount} words
    </div>
  </div>
{:else if att.kind === 'image' && att.dataUrl}
  <img src={att.dataUrl} alt={att.name} class="max-h-16 max-w-24 rounded" />
{:else}
  <div class="text-xs opacity-70">{att.name}</div>
{/if}
```

#### Message Display Enhancement
```svelte
<!-- packages/client/src/lib/comps/apps/ChatAppMessage.svelte -->

{#if att.kind === 'text' && (att.fileUrl || att.dataUrl)}
  <div class="mt-2 border rounded-lg p-3 bg-surface-50-950">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium">{att.name}</span>
      <span class="text-xs opacity-60">
        {att.alt || 'text'} • {att.width || 'unknown'} lines
      </span>
    </div>
    <iframe src={att.fileUrl || att.dataUrl} class="w-full h-48 border-0" title={att.name}></iframe>
  </div>
{:else if att.kind === 'image' && (att.fileUrl || att.dataUrl)}
  <img src={att.fileUrl || att.dataUrl} alt={att.name} class="rounded border object-contain max-w-[240px] max-h-[200px]" />
{/if}
```

### 4. AI Integration

#### Enhanced Message Processing
```typescript
// packages/core/src/agents/SimpleChatAgent.ts

const remappedMessages: LangChatMessage[] = [
  { role: "system", content: systemPrompt },
  ...messages.map((m) => {
    const hasAttachments = Array.isArray((m as any).attachments) && (m as any).attachments.length > 0;
    if (!hasAttachments) {
      return {
        role: normalizedRole as "assistant" | "user",
        content: m.text || "",
      } as LangChatMessage;
    }

    const attachments = (m as any).attachments as Array<any>;
    const images = attachments.filter(a => a?.kind === 'image' && typeof a?.dataUrl === 'string');
    const textFiles = attachments.filter(a => a?.kind === 'text' && a?.file?.tree && a?.file?.vertex);

    // Handle vision-capable models with images
    if (supportsVision && images.length > 0) {
      const parts: LangContentPart[] = [];
      
      // Add text content first
      if (m.text && m.text.trim().length > 0) {
        parts.push({ type: 'text', text: m.text });
      }
      
      // Add text file contents (need to load from CAS)
      for (const textFile of textFiles) {
        const fileContent = await loadTextFileContent(textFile.file.tree, textFile.file.vertex);
        if (fileContent) {
          const fileHeader = `\n\n--- File: ${textFile.name} (${textFile.alt || 'text'}) ---\n`;
          parts.push({ type: 'text', text: fileHeader + fileContent });
        }
      }
      
      // Add images
      for (const img of images) {
        const { base64, mimeType } = parseDataUrl(img.dataUrl as string);
        parts.push({ type: 'image', image: { kind: 'base64', base64, mimeType } });
      }
      
      return { role: normalizedRole as "assistant" | "user", content: parts } as LangChatMessage;
    }

    // Handle non-vision models or text-only attachments
    let content = m.text || "";
    
    // Add text file contents (need to load from CAS)
    for (const textFile of textFiles) {
      const fileContent = await loadTextFileContent(textFile.file.tree, textFile.file.vertex);
      if (fileContent) {
        const fileHeader = `\n\n--- File: ${textFile.name} (${textFile.alt || 'text'}, ${textFile.width || 'unknown'} lines) ---\n`;
        content += fileHeader + fileContent;
      }
    }
    
    // Add image descriptions for non-vision models
    if (images.length > 0) {
      const names = images.map((a) => a.name).filter(Boolean).join(', ');
      content += `\n\n[User attached ${images.length} image(s): ${names}]`;
    }
    
    return {
      role: normalizedRole as "assistant" | "user",
      content: content,
    } as LangChatMessage;
  }),
];

// Helper function to load text file content from CAS
async function loadTextFileContent(treeId: string, vertexId: string): Promise<string | null> {
  try {
    // Load the file vertex to get the hash
    const appTree = await this.space.loadAppTree(treeId);
    if (!appTree) return null;
    
    const fileVertex = appTree.tree.getVertex(vertexId);
    if (!fileVertex) return null;
    
    const hash = fileVertex.getProperty("hash") as string;
    if (!hash) return null;

    // Load the file content from CAS
    const store = this.space.getFileStore();
    if (!store) return null;
    
    const fileData = await store.getData(hash);
    if (!fileData) return null;
    
    // Convert to text
    return new TextDecoder().decode(fileData);
  } catch (error) {
    console.warn('Failed to load text file content:', error);
    return null;
  }
}
```

### 5. Storage and Persistence (CAS-Based)

**Key Principle**: Text files follow the same storage pattern as images - content is stored in Content-Addressed Storage (CAS) and referenced by file vertices, not stored directly in message vertices.

#### Enhanced Attachment Structure
```typescript
// Update attachment types to include text files
export type AttachmentPreview = {
  id: string;
  kind: 'image' | 'text' | 'file';
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // For images (transient)
  content?: string; // For text files (transient, only during upload)
  metadata?: TextFileMetadata; // For text files (transient, only during upload)
  width?: number; // For images, or lineCount for text files
  height?: number; // For images, or charCount for text files
  alt?: string; // For accessibility, language for text files
};

export interface TextFileMetadata {
  lineCount: number;
  charCount: number;
  wordCount: number;
  hasContent: boolean;
  language: string;
  encoding: string;
}
```

#### File Storage Strategy
```typescript
// packages/core/src/spaces/ChatAppData.ts

// In newMessage method, handle text file persistence
if (a?.kind === 'text' && typeof a?.content === 'string') {
  try {
    // Store text content in CAS (same as images)
    const textBlob = new Blob([a.content], { type: 'text/plain' });
    const put = await store.putBlob(textBlob);
    
    const fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder,
      name: a.name || 'text-file',
      hash: put.hash,
      mimeType: a.mimeType,
      size: a.size,
      width: a.metadata?.lineCount, // Use lineCount as width for consistency
      height: a.metadata?.charCount // Use charCount as height for consistency
    });
    
    refs.push({
      id: a.id,
      kind: 'text',
      name: a.name,
      alt: a.metadata?.language || 'text file', // Use language as alt text
      file: { tree: filesTree.getId(), vertex: fileVertex.id }
    });
  } catch (e) {
    // If persist fails, fall back to in-memory with transient content
    refs.push({
      ...a,
      content: a.content // Keep content only for transient fallback
    });
  }
}
```

### 6. Implementation Phases

#### Phase 1: Basic Text File Support
- [ ] Update file picker to accept text files
- [ ] Implement text file processing pipeline
- [ ] Add text file preview in message form
- [ ] Update message display to show text file content
- [ ] Basic AI integration (append text content to messages)

#### Phase 2: Enhanced Features
- [ ] Syntax highlighting for code files
- [ ] File content search and filtering
- [ ] Large file handling (truncation, pagination)
- [ ] File type-specific processing (CSV parsing, JSON validation)

#### Phase 3: Advanced Integration
- [ ] Context-aware file inclusion (smart positioning in messages)
- [ ] File content summarization
- [ ] Multi-file diff and comparison
- [ ] File content editing within chat

### 7. Technical Considerations

#### CAS-Based Architecture Benefits
- **Consistency**: Text files use the same storage pattern as images
- **Deduplication**: Identical text files are stored only once
- **Scalability**: Large text files don't bloat message vertices
- **Performance**: File content is loaded on-demand, not with every message
- **Sync**: File references work seamlessly with RepTree sync system

#### Performance
- **Large Files**: Implement size limits (e.g., 1MB for text files)
- **Memory Usage**: CAS-based storage prevents memory bloat in message vertices
- **Caching**: Cache processed text content for repeated access
- **Lazy Loading**: Text content loaded only when needed for AI processing

#### Security
- **File Validation**: Validate file content for malicious code/scripts
- **Size Limits**: Prevent DoS attacks through extremely large files
- **Content Filtering**: Optional content filtering for sensitive information

#### User Experience
- **Loading States**: Show progress for large file processing
- **Error Handling**: Graceful fallbacks for unsupported or corrupted files
- **Accessibility**: Screen reader support for file content

### 8. Testing Strategy

#### Unit Tests
- Text file processing pipeline
- Content-based file type detection
- Binary signature detection
- MIME type detection
- Content normalization
- Metadata extraction

#### Integration Tests
- File upload and persistence
- AI message processing with text files
- UI rendering of text file attachments

#### End-to-End Tests
- Complete workflow from file selection to AI response
- Large file handling
- Error scenarios

## Conclusion

This proposal provides a comprehensive approach to adding text file attachments to Sila's chat system. The implementation leverages existing infrastructure while adding new capabilities for text processing and AI integration. The phased approach allows for incremental development and testing, ensuring a robust and user-friendly feature.

The key benefits include:
- Enhanced AI context through text file content
- Improved developer workflow for code reviews and debugging
- Better documentation sharing and collaboration
- Consistent user experience with existing image attachments

The implementation maintains Sila's local-first architecture while providing powerful new capabilities for text-based collaboration and AI assistance.
