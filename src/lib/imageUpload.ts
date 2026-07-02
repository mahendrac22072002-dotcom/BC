import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';

export type ImageCategory = 
  | "listing" 
  | "profile" 
  | "kyc" 
  | "branding" 
  | "cms" 
  | "blog" 
  | "staff" 
  | "support" 
  | "chat" 
  | "deal" 
  | "notification" 
  | "general";

interface CategoryPreset {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  outputFormat?: "webp" | "jpeg" | "png";
  quality?: number;
}

export const CATEGORY_PRESETS: Record<ImageCategory, CategoryPreset> = {
  listing: { maxSizeMB: 0.4, maxWidthOrHeight: 1920 },
  profile: { maxSizeMB: 0.15, maxWidthOrHeight: 512 },
  kyc: { maxSizeMB: 0.5, maxWidthOrHeight: 1600 },
  branding: { maxSizeMB: 0.2, maxWidthOrHeight: 512 },
  cms: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  blog: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  staff: { maxSizeMB: 0.15, maxWidthOrHeight: 512 },
  support: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  chat: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  deal: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  notification: { maxSizeMB: 0.2, maxWidthOrHeight: 512 },
  general: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
};

/**
 * Validates if the given file is an accepted format (images or PDFs).
 */
export function validateImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
  return validTypes.includes(file.type);
}

/**
 * Generates a temporary in-memory preview (Base64 data URL) of the file.
 * NOTE: Base64 should NEVER be stored in the database.
 */
export function generatePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image based on the provided preset options.
 * This internally preserves aspect ratio and outputs webp when possible.
 */
export async function compressImage(file: File, preset: CategoryPreset): Promise<File> {
  // Always preserve transparency by keeping PNGs if strictly needed,
  // otherwise default to WebP for modern web performance.
  const isPng = file.type === 'image/png';
  const fileType = isPng ? 'image/png' : 'image/webp';

  const options = {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: preset.maxWidthOrHeight,
    useWebWorker: true,
    fileType: preset.outputFormat ? `image/${preset.outputFormat}` : fileType,
    initialQuality: preset.quality || 0.8,
    alwaysKeepResolution: false
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error during image compression:', error);
    throw new Error('Failed to compress image.');
  }
}

/**
 * Convenience wrapper if only explicit resizing is required.
 */
export async function resizeImage(file: File, maxWidthOrHeight: number): Promise<File> {
  const options = {
    maxWidthOrHeight,
    useWebWorker: true,
  };
  return await imageCompression(file, options);
}

/**
 * Raw upload function to push an already compressed file to Supabase.
 */
export async function uploadCompressedImage(
  bucket: string, 
  path: string, 
  file: File,
  upsert: boolean = false
): Promise<{ path: string, url: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { 
      upsert, 
      contentType: file.type 
    });

  if (error) {
    console.error('Storage Upload Error:', error);
    throw error;
  }

  // Optionally construct public url (assuming buckets are public or signed URLs will be used later)
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { path: data.path, url: publicUrl };
}

/**
 * Deletes an image from a Supabase Storage bucket.
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Storage Delete Error:', error);
    throw error;
  }
}

export interface UploadImageOptions {
  bucket: string;
  file: File;
  category: ImageCategory;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
}

/**
 * The unified pipeline to process and upload a file across the platform.
 * It handles validation, compression based on the category preset (skips compression for PDFs), and uploading to Storage.
 * Returns the final path and public URL.
 */
export async function uploadImage(options: UploadImageOptions): Promise<{ path: string, url: string, sizeBytes: number }> {
  const { bucket, file, category, folder, fileName, upsert = false } = options;

  if (!validateImage(file)) {
    throw new Error('Invalid file format. Supported formats: JPEG, PNG, WebP, HEIC, PDF.');
  }

  const isPdf = file.type === 'application/pdf';
  let processedFile = file;

  if (!isPdf) {
    const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.general;
    processedFile = await compressImage(file, preset);
  }

  // Generate unique file path
  const ext = isPdf ? 'pdf' : (processedFile.type.split('/')[1] || 'webp');
  const finalName = fileName ? `${fileName}.${ext}` : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const fullPath = folder ? `${folder}/${finalName}` : finalName;

  const res = await uploadCompressedImage(bucket, fullPath, processedFile, upsert);
  return { ...res, sizeBytes: processedFile.size };
}
