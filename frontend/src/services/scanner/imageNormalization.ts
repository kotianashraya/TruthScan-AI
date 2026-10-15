import * as UTIF from 'utif';

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_NORMALIZED_DIMENSION = 2400;

export const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'gif', 'bmp', 'tif', 'tiff'] as const;
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'image/avif', 'image/gif', 'image/bmp', 'image/tiff'
] as const;

export type SupportedImageExtension = typeof SUPPORTED_EXTENSIONS[number];

const MIME_BY_EXTENSION: Record<SupportedImageExtension, string[]> = {
  jpg: ['image/jpeg', 'image/jpg'], jpeg: ['image/jpeg', 'image/jpg'], png: ['image/png'],
  webp: ['image/webp'], heic: ['image/heic', 'image/heif'], heif: ['image/heif', 'image/heic'],
  avif: ['image/avif'], gif: ['image/gif'], bmp: ['image/bmp', 'image/x-ms-bmp'],
  tif: ['image/tiff'], tiff: ['image/tiff']
};

export function getImageExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() as SupportedImageExtension | undefined;
}

export function validateImageFile(file: File) {
  if (file.size > MAX_IMAGE_SIZE) return 'File is too large. Maximum size is 10 MB.';
  const extension = getImageExtension(file.name);
  const mimeMatches = extension && MIME_BY_EXTENSION[extension]?.includes(file.type.toLowerCase());
  const extensionMatches = extension && SUPPORTED_EXTENSIONS.includes(extension);
  if (!extensionMatches || (!mimeMatches && file.type !== '')) {
    return 'Unsupported image format. Please try JPG, PNG, or WebP.';
  }
  return null;
}

/**
 * Extracts EXIF orientation tag from a JPEG ArrayBuffer.
 * Returns 1 (normal) if not found or not JPEG.
 */
export function getExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return 1;

  let offset = 2;
  const length = view.byteLength;

  while (offset + 4 < length) {
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xFFE1) {
      // APP1 marker - check for Exif header
      const segmentLength = view.getUint16(offset, false);
      offset += 2;
      if (offset + 4 <= length && view.getUint32(offset, false) === 0x45786966) {
        // "Exif" header
        const tiffStart = offset + 6;
        if (tiffStart + 8 > length) return 1;

        const little = view.getUint16(tiffStart, false) === 0x4949;
        const firstIfdOffset = view.getUint32(tiffStart + 4, little);
        let ifdOffset = tiffStart + firstIfdOffset;

        if (ifdOffset + 2 > length) return 1;
        const tagCount = view.getUint16(ifdOffset, little);
        ifdOffset += 2;

        for (let i = 0; i < tagCount; i++) {
          const entryOffset = ifdOffset + (i * 12);
          if (entryOffset + 12 > length) break;
          const tag = view.getUint16(entryOffset, little);
          if (tag === 0x0112) {
            // Orientation tag
            return view.getUint16(entryOffset + 8, little);
          }
        }
      }
      offset += segmentLength - 2;
    } else if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA || marker === 0xFFD9) {
      // SOS or EOI or invalid
      break;
    } else {
      const segmentLength = view.getUint16(offset, false);
      offset += segmentLength;
    }
  }

  return 1;
}

function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This browser cannot decode the selected image format.'));
  });
}

function computeTargetDimensions(width: number, height: number, maxDim = MAX_NORMALIZED_DIMENSION) {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const scale = maxDim / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function renderCanvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality = 0.92): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => (result ? resolve(result) : reject(new Error('Unable to convert image.'))),
      mimeType,
      quality
    );
  });
}

async function tiffToPng(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error('TIFF image contains no readable frames.');
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const canvas = document.createElement('canvas');
  canvas.width = ifds[0].width;
  canvas.height = ifds[0].height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create a TIFF conversion canvas.');
  context.putImageData(new ImageData(new Uint8ClampedArray(rgba), canvas.width, canvas.height), 0, 0);
  const blob = await renderCanvasToBlob(canvas, 'image/png');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.png`, { type: 'image/png' });
}

export async function normalizeImageFile(file: File): Promise<File> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const extension = getImageExtension(file.name);

  // 1. Handle HEIC / HEIF
  let workingFile = file;
  if (extension === 'heic' || extension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    workingFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  }

  // 2. Handle TIFF
  if (extension === 'tif' || extension === 'tiff') {
    return tiffToPng(workingFile);
  }

  // 3. Modern orientation-aware decoding via createImageBitmap
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(workingFile, { imageOrientation: 'from-image' });
      try {
        const { width: targetW, height: targetH } = computeTargetDimensions(bitmap.width, bitmap.height);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Unable to create canvas context.');

        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const outMime = workingFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await renderCanvasToBlob(canvas, outMime, 0.92);
        const ext = outMime === 'image/png' ? 'png' : 'jpg';
        return new File([blob], `${workingFile.name.replace(/\.[^.]+$/, '')}.${ext}`, { type: outMime });
      } finally {
        bitmap.close();
      }
    } catch (bitmapErr) {
      console.warn('[NORMALIZATION] createImageBitmap orientation failed, falling back to EXIF parse', bitmapErr);
    }
  }

  // 4. Fallback: Parse EXIF Orientation manually and draw with HTMLImageElement
  const buffer = await workingFile.arrayBuffer();
  const orientation = getExifOrientation(buffer);

  const url = URL.createObjectURL(workingFile);
  try {
    const image = await loadImage(url);
    const rawW = image.naturalWidth;
    const rawH = image.naturalHeight;
    if (!rawW || !rawH) throw new Error('Unable to determine image dimensions.');

    const isRotated90 = orientation === 6 || orientation === 8;
    const orientedW = isRotated90 ? rawH : rawW;
    const orientedH = isRotated90 ? rawW : rawH;

    const { width: targetW, height: targetH } = computeTargetDimensions(orientedW, orientedH);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to normalize image dimensions.');

    const scaleX = targetW / orientedW;
    const scaleY = targetH / orientedH;

    ctx.save();
    switch (orientation) {
      case 3: // 180°
        ctx.translate(targetW, targetH);
        ctx.rotate(Math.PI);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(image, 0, 0);
        break;
      case 6: // 90° CW
        ctx.translate(targetW, 0);
        ctx.rotate(Math.PI / 2);
        ctx.scale(scaleY, scaleX);
        ctx.drawImage(image, 0, 0);
        break;
      case 8: // 270° CW (90° CCW)
        ctx.translate(0, targetH);
        ctx.rotate(-Math.PI / 2);
        ctx.scale(scaleY, scaleX);
        ctx.drawImage(image, 0, 0);
        break;
      default:
        ctx.drawImage(image, 0, 0, targetW, targetH);
        break;
    }
    ctx.restore();

    const outMime = workingFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await renderCanvasToBlob(canvas, outMime, 0.92);
    const ext = outMime === 'image/png' ? 'png' : 'jpg';
    return new File([blob], `${workingFile.name.replace(/\.[^.]+$/, '')}.${ext}`, { type: outMime });
  } finally {
    URL.revokeObjectURL(url);
  }
}
