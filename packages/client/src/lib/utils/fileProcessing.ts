import { heicConverter } from './heicConverter';

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