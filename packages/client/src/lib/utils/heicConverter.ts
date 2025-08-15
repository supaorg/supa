// HEIC Converter Abstraction
export interface HeicConverter {
  convert(heicFile: File): Promise<Blob>;
}

// Browser implementation using heic2any
export class BrowserHeicConverter implements HeicConverter {
  async convert(heicFile: File): Promise<Blob> {
    try {
      const { heic2any } = await import('heic2any');
      
      const jpegBlob = await heic2any({
        blob: heicFile,
        toType: 'image/jpeg',
        quality: 0.85 // Good balance of quality and size
      });
      
      return jpegBlob;
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error(`Failed to convert HEIC file: ${error.message}`);
    }
  }
}

// Node.js implementation for testing (simple mock)
export class NodeHeicConverter implements HeicConverter {
  async convert(heicFile: File): Promise<Blob> {
    // For testing purposes, create a simple JPEG blob
    // In a real implementation, you might use sharp, jimp, or other Node.js libraries
    const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    const base64Data = jpegDataUrl.split(',')[1]!;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/jpeg' });
  }
}

// Factory function to get the appropriate converter
export function createHeicConverter(): HeicConverter {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
    return new BrowserHeicConverter();
  } else {
    // Node.js environment (for testing)
    return new NodeHeicConverter();
  }
}

// Default converter instance
export const heicConverter = createHeicConverter();