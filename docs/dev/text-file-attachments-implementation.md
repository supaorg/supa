# Text File Attachments Implementation

This document describes the implementation of text file attachments in Sila's chat system, allowing users to attach text files (`.txt`, `.md`, `.json`, `.csv`, `.js`, `.ts`, `.py`, etc.) to chat messages.

## Overview

The text file attachments feature allows users to:
- Attach text files to chat messages
- Have the text content automatically included in AI conversations
- View file metadata (language, line count, word count) in the UI
- Store files efficiently using Content-Addressed Storage (CAS)

## Supported File Types

The system supports a wide range of text file types:

### Plain Text
- `.txt`, `.log`, `.csv`

### Markup and Documentation
- `.md`, `.markdown`, `.html`, `.htm`, `.css`

### Code Files
- `.js`, `.mjs`, `.ts`, `.tsx`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`
- `.cs`, `.php`, `.rb`, `.go`, `.rs`, `.swift`, `.kt`, `.scala`

### Data Formats
- `.json`, `.xml`, `.csv`, `.tsv`

### Configuration Files
- `.yml`, `.yaml`, `.toml`, `.ini`, `.cfg`, `.conf`

### Shell Scripts
- `.sh`, `.bash`, `.zsh`, `.fish`, `.bat`, `.cmd`, `.ps1`

## Implementation Details

### File Processing Pipeline

The text file processing follows the same pattern as image processing:

1. **`processTextFileForUpload()`**: Validates file type using content-based detection
2. **`optimizeTextFile()`**: Handles any text-specific optimizations (currently none, but maintains pipeline consistency)

### Content-Based File Detection

Instead of relying solely on file extensions, the system uses content-based detection:

1. **MIME Type Check**: First check for known text MIME types
2. **Binary Signature Detection**: Check for common binary file signatures (JPEG, PNG, ZIP, etc.)
3. **Content Analysis**: Analyze the first 1KB of the file to determine if it contains mostly printable text
4. **Extension Fallback**: Use file extension as a final fallback for edge cases

This approach allows the system to:
- Handle files with incorrect extensions (e.g., `.txt` files that are actually images)
- Support files without extensions
- Detect text files even when MIME types are incorrect
- Provide more accurate file type detection

### Storage Strategy

Text files follow the same storage pattern as images:
- Content is stored in Content-Addressed Storage (CAS)
- File references are stored in message vertices, not the content itself
- This ensures consistency with the existing architecture
- Provides deduplication and scalability benefits

### AI Integration

Text file content is automatically included in AI conversations:

1. **Vision-capable models**: Text content is added as text parts in multi-modal messages
2. **Text-only models**: Text content is appended to the message text with clear file headers
3. **File metadata**: Language detection and line counts are included for context

## Usage

### Attaching Text Files

1. Click the attachment button in the message form
2. Select one or more text files
3. The system will automatically detect and process the files
4. File previews will show metadata (language, line count, word count)
5. Send the message to include the file content in the AI conversation

### File Size Limits

- Recommended maximum: 1MB for text files
- Larger files may impact performance
- The system will process files up to available memory limits

### Supported Languages

The system automatically detects programming languages and file types:
- JavaScript, TypeScript, Python, Java, C/C++, C#, PHP, Ruby, Go, Rust
- Swift, Kotlin, Scala, Shell scripts, Markdown, JSON, XML, YAML, TOML
- CSV, INI, Batch files, PowerShell scripts

## Technical Architecture

### Key Components

1. **File Processing Utilities** (`packages/client/src/lib/utils/fileProcessing.ts`)
   - `isTextFile()`: Content-based file type detection
   - `processTextFileForUpload()`: File validation and processing
   - `extractTextFileMetadata()`: Extract file statistics and language
   - `detectLanguage()`: Language detection based on file extension

2. **UI Components**
   - `SendMessageForm.svelte`: Updated to handle text file selection and preview
   - `ChatAppMessage.svelte`: Updated to display text file attachments

3. **Core Integration**
   - `ChatAppData.ts`: Handles text file persistence in CAS
   - `SimpleChatAgent.ts`: Integrates text file content into AI messages

### File Processing Functions

```typescript
// Check if a file is a text file
const isText = await isTextFile(file);

// Process a text file for upload
const processedFile = await processTextFileForUpload(file);

// Read text content
const content = await readFileAsText(file);

// Extract metadata
const metadata = extractTextFileMetadata(file, content);
```

### Message Structure

Text file attachments are stored with the following structure:

```typescript
{
  id: string;
  kind: 'text';
  name: string;
  mimeType: string;
  size: number;
  content?: string; // Transient during upload
  metadata?: TextFileMetadata; // Transient during upload
  width?: number; // Line count
  height?: number; // Character count
  alt?: string; // Language
  file?: { tree: string; vertex: string }; // CAS reference
}
```

## Testing

The implementation includes comprehensive tests:

- **Unit Tests**: File processing functions, content detection, metadata extraction
- **Integration Tests**: Complete workflow from file selection to AI processing
- **Edge Cases**: Binary files with text extensions, empty files, large files

Run tests with:
```bash
npm run test -- --run src/text-file-attachments.test.ts
```

## Security Considerations

1. **Content Validation**: All files are validated for actual text content, not just extensions
2. **Binary Detection**: Binary files are rejected even with text extensions
3. **Size Limits**: Large files may be truncated or rejected
4. **Content Filtering**: Optional content filtering can be implemented for sensitive information

## Performance Considerations

1. **Lazy Loading**: Text content is loaded on-demand for AI processing
2. **Caching**: Processed file content can be cached for repeated access
3. **Memory Management**: Large files are handled efficiently through CAS storage
4. **Async Processing**: File processing is non-blocking and asynchronous

## Future Enhancements

1. **Syntax Highlighting**: Code files could be displayed with syntax highlighting
2. **File Content Search**: Search within attached text files
3. **Large File Handling**: Pagination and truncation for very large files
4. **File Type-Specific Processing**: CSV parsing, JSON validation, etc.
5. **Context-Aware Inclusion**: Smart positioning of file content in messages

## Migration Notes

This implementation is backward compatible:
- Existing image attachments continue to work unchanged
- New text file attachments are handled alongside images
- No changes required to existing message storage or retrieval
- CAS-based storage ensures consistency with existing architecture