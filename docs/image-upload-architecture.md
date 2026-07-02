# Image Upload Architecture

## Overview
The BrokerConnect platform uses a unified, centralized image optimization pipeline for all uploads. This ensures all images are automatically compressed, resized, and converted to modern formats (like WebP) before they hit Supabase Storage.

## The Shared Utility: `src/lib/imageUpload.ts`
All file uploads must use the `uploadImage` function exported from `src/lib/imageUpload.ts`. 

**No component should ever call `supabase.storage.from().upload()` directly.**

### Public API
- `uploadImage(options)`: The primary wrapper. Validates, compresses, resizes, and uploads. Returns `{ path, url, sizeBytes }`.
- `validateImage(file)`: Validates accepted file types (JPEG, PNG, WebP, HEIC, PDF).
- `generatePreview(file)`: Generates a temporary Base64 preview for the client UI. **Base64 is never saved to PostgreSQL.**
- `compressImage(file, preset)`: The raw compression engine via `browser-image-compression`.
- `deleteImage(bucket, path)`: Deletes an asset from Storage.

### Category Presets
To ensure uniformity across the platform, components do not hardcode limits. Instead, they pass a `category` to `uploadImage()`. The following presets are configured in `CATEGORY_PRESETS`:

- `listing`: 400 KB, Max Width: 1920px
- `profile`: 150 KB, 512x512
- `kyc`: 500 KB, Max Width: 1600px (PDFs bypass compression)
- `branding`: 200 KB, 512x512
- `cms`: 300 KB, 1600px
- `blog`: 300 KB, 1600px
- `staff`: 150 KB, 512x512
- `support`: 300 KB, 1600px
- `chat`: 300 KB, 1600px
- `deal`: 300 KB, 1600px
- `notification`: 200 KB, 512x512
- `general`: 300 KB, 1600px

## Upload Flow
1. **User selects image:** Component grabs `File` object.
2. **`uploadImage({ ... })` called:** Component invokes the utility.
3. **Validation:** Checks if format is supported.
4. **Compression:** If image (not PDF), it's resized/compressed per category preset. Output is WebP (or PNG if original was PNG).
5. **Upload:** Processed file is uploaded to the specified Supabase Storage bucket.
6. **Return:** The Storage `path`, public `url`, and `sizeBytes` are returned to the caller to store in the PostgreSQL database.

## Future Developer Guide
To add a new upload feature to the platform:
1. Review the `ImageCategory` types in `src/lib/imageUpload.ts`.
2. If your feature fits an existing category, use it.
3. If it requires a distinct size limit, add a new `ImageCategory` and its `CategoryPreset`.
4. Import `uploadImage` and invoke it in your mutation/submit handler.
