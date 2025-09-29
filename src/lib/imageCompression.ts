import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  format: SaveFormat.JPEG,
};

export class ImageCompressionService {
  /**
   * Compress and resize image to meet performance requirements
   * - Resize to max 1600px edge as per Step 13 & 16 requirements
   * - Compress with 80% quality for optimal size/quality balance
   */
  static async compressImage(
    imageUri: string,
    options: ImageCompressionOptions = {}
  ): Promise<string> {
    try {
      const finalOptions = { ...DEFAULT_OPTIONS, ...options };
      
      // Get image info to determine if compression is needed
      const imageInfo = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });
      
      const actions: any[] = [];
      let needsResize = false;
      
      // Check if image exceeds maximum dimensions
      if (imageInfo.width > finalOptions.maxWidth || imageInfo.height > finalOptions.maxHeight) {
        const aspectRatio = imageInfo.width / imageInfo.height;
        let newWidth = finalOptions.maxWidth;
        let newHeight = finalOptions.maxHeight;
        
        if (aspectRatio > 1) {
          // Landscape - limit by width
          newHeight = finalOptions.maxWidth / aspectRatio;
        } else {
          // Portrait - limit by height
          newWidth = finalOptions.maxHeight * aspectRatio;
        }
        
        actions.push({
          resize: {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
          },
        });
        
        needsResize = true;
      }
      
      // Apply compression if needed or if image is large
      const shouldCompress = needsResize || imageInfo.width * imageInfo.height > 1000000; // 1MP threshold
      
      if (!shouldCompress && finalOptions.quality >= 1) {
        // No compression needed, return original
        return imageUri;
      }
      
      const result = await manipulateAsync(
        imageUri,
        actions,
        {
          compress: finalOptions.quality,
          format: finalOptions.format,
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Image compression failed:', error);
      // Return original image if compression fails
      return imageUri;
    }
  }
  
  /**
   * Compress multiple images in parallel with progress tracking
   */
  static async compressImages(
    imageUris: string[],
    options: ImageCompressionOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      try {
        const compressedUri = await this.compressImage(imageUris[i], options);
        results.push(compressedUri);
        onProgress?.(i + 1, imageUris.length);
      } catch (error) {
        console.error(`Failed to compress image ${i}:`, error);
        results.push(imageUris[i]); // Use original on failure
        onProgress?.(i + 1, imageUris.length);
      }
    }
    
    return results;
  }
  
  /**
   * Get compressed image info for validation
   */
  static async getImageInfo(imageUri: string): Promise<{
    width: number;
    height: number;
    size?: number;
  }> {
    try {
      const result = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });
      
      // Try to get file size (not always available)
      let size: number | undefined;
      try {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        size = blob.size;
      } catch {
        // Size unavailable, that's okay
      }
      
      return {
        width: result.width,
        height: result.height,
        size,
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error}`);
    }
  }
  
  /**
   * Validate image meets requirements
   */
  static async validateImage(imageUri: string): Promise<{
    isValid: boolean;
    issues: string[];
    info: { width: number; height: number; size?: number };
  }> {
    try {
      const info = await this.getImageInfo(imageUri);
      const issues: string[] = [];
      
      if (info.width > 1600) {
        issues.push(`Width ${info.width}px exceeds maximum 1600px`);
      }
      
      if (info.height > 1600) {
        issues.push(`Height ${info.height}px exceeds maximum 1600px`);
      }
      
      if (info.size && info.size > 5 * 1024 * 1024) {
        issues.push(`File size ${Math.round(info.size / 1024 / 1024)}MB exceeds recommended 5MB`);
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        info,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Failed to validate image: ${error}`],
        info: { width: 0, height: 0 },
      };
    }
  }
  
  /**
   * Smart compression that chooses best settings based on image content
   */
  static async smartCompress(imageUri: string): Promise<{
    uri: string;
    originalSize?: number;
    compressedSize?: number;
    compressionRatio?: number;
  }> {
    try {
      const originalInfo = await this.getImageInfo(imageUri);
      
      // Determine compression settings based on image characteristics
      let quality = 0.8;
      const maxDimension = 1600;
      
      // Higher compression for very large images
      if (originalInfo.width > 2000 || originalInfo.height > 2000) {
        quality = 0.7;
      }
      
      // Lower compression for smaller images to maintain quality
      if (originalInfo.width < 800 && originalInfo.height < 800) {
        quality = 0.9;
      }
      
      const compressedUri = await this.compressImage(imageUri, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality,
      });
      
      const compressedInfo = await this.getImageInfo(compressedUri);
      
      const compressionRatio = originalInfo.size && compressedInfo.size
        ? originalInfo.size / compressedInfo.size
        : undefined;
      
      return {
        uri: compressedUri,
        originalSize: originalInfo.size,
        compressedSize: compressedInfo.size,
        compressionRatio,
      };
    } catch (error) {
      throw new Error(`Smart compression failed: ${error}`);
    }
  }
}

// Helper function for picking and compressing images
export const pickAndCompressImage = async (
  options: ImagePicker.ImagePickerOptions & { compression?: ImageCompressionOptions } = {}
): Promise<{ uri: string; compressed: boolean } | null> => {
  try {
    const { compression, ...pickerOptions } = options;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // We'll compress afterwards
      ...pickerOptions,
    });
    
    if (result.canceled) {
      return null;
    }
    
    const imageUri = result.assets[0].uri;
    const compressedUri = await ImageCompressionService.compressImage(imageUri, compression);
    
    return {
      uri: compressedUri,
      compressed: compressedUri !== imageUri,
    };
  } catch (error) {
    console.error('Pick and compress image failed:', error);
    throw error;
  }
};

// Helper function for multiple image selection with compression
export const pickAndCompressImages = async (
  options: ImagePicker.ImagePickerOptions & { compression?: ImageCompressionOptions } = {},
  onProgress?: (completed: number, total: number) => void
): Promise<{ uris: string[]; compressed: boolean[] } | null> => {
  try {
    const { compression, ...pickerOptions } = options;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1, // We'll compress afterwards
      ...pickerOptions,
    });
    
    if (result.canceled || result.assets.length === 0) {
      return null;
    }
    
    const imageUris = result.assets.map(asset => asset.uri);
    const compressedUris = await ImageCompressionService.compressImages(
      imageUris,
      compression,
      onProgress
    );
    
    const compressed = compressedUris.map((uri, index) => uri !== imageUris[index]);
    
    return {
      uris: compressedUris,
      compressed,
    };
  } catch (error) {
    console.error('Pick and compress images failed:', error);
    throw error;
  }
};