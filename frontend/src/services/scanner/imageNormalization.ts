import * as UTIF from 'utif';

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
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

function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This browser cannot decode the selected image format.'));
  });
}

async function canvasToPng(image: HTMLImageElement, name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context || !canvas.width || !canvas.height) throw new Error('Unable to normalize image dimensions.');
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('Unable to convert image.')), 'image/png');
  });
  return new File([blob], `${name.replace(/\.[^.]+$/, '')}.png`, { type: 'image/png' });
}

async function tiffToPng(file: File) {
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
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('Unable to convert TIFF image.')), 'image/png');
  });
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.png`, { type: 'image/png' });
}

export async function normalizeImageFile(file: File) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const extension = getImageExtension(file.name);
  if (extension === 'heic' || extension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  }

  if (extension === 'tif' || extension === 'tiff') return tiffToPng(file);

  const url = URL.createObjectURL(file);
  try {
    // Browser decoding converts GIF to its first frame and handles BMP/AVIF where supported.
    const image = await loadImage(url);
    return await canvasToPng(image, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}
