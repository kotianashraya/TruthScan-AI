import { describe, expect, it } from 'vitest';
import { getImageExtension, validateImageFile } from './imageNormalization';

function image(name: string, type: string, size = 100) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('image input validation', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'], ['photo.png', 'image/png'], ['photo.webp', 'image/webp'],
    ['photo.heic', 'image/heic'], ['photo.heif', 'image/heif'], ['photo.avif', 'image/avif'],
    ['photo.gif', 'image/gif'], ['photo.bmp', 'image/bmp'], ['photo.tif', 'image/tiff'], ['photo.tiff', 'image/tiff']
  ])('accepts %s', (name, type) => expect(validateImageFile(image(name, type))).toBeNull());

  it('rejects unsupported formats', () => expect(validateImageFile(image('photo.svg', 'image/svg+xml'))).toContain('Unsupported'));
  it('rejects files over 10 MB', () => expect(validateImageFile(image('photo.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1))).toContain('10 MB'));
  it('detects extensions case-insensitively', () => expect(getImageExtension('PHOTO.HEIF')).toBe('heif'));
});
