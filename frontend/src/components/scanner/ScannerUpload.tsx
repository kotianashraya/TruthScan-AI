import React, { useRef, useState, DragEvent } from 'react';
import { normalizeImageFile, validateImageFile } from '@/services/scanner/imageNormalization';

export interface SelectedFile {
  file: File;
  url: string;
}

export default function ScannerUpload({
  onSelect,
  onError,
}: {
  onSelect: (files: SelectedFile | SelectedFile[]) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const validateAndSendFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList).slice(0, 2);
    if (!rawFiles.length) return;

    for (const f of rawFiles) {
      const err = validateImageFile(f);
      if (err) {
        onError(err);
        return;
      }
    }

    try {
      const normalizedList: SelectedFile[] = [];
      for (const f of rawFiles) {
        const normalizedFile = await normalizeImageFile(f);
        const url = URL.createObjectURL(normalizedFile);
        normalizedList.push({ file: normalizedFile, url });
      }
      onSelect(normalizedList.length === 1 ? normalizedList[0] : normalizedList);
    } catch (error) {
      console.error('[SCANNER] image normalization failed', error);
      onError('Unable to read this image format. Please try JPG, PNG, or WebP.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) void validateAndSendFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) void validateAndSendFiles(files);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-xl border border-white/10 bg-black/40 p-6 flex flex-col items-center justify-center text-center ${dragging ? 'ring-2 ring-cyan-400/40' : ''}`}
        aria-label="File upload dropzone"
      >
        <div className="text-brand-cyan text-3xl mb-3">📷</div>
        <div className="text-lg font-semibold">Drag & drop packaging photo(s) here</div>
        <div className="text-xs text-gray-400 mt-1">Upload 1 photo or both Front + Back faces together</div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => { inputRef.current?.click(); }} className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs" aria-label="Upload packaging photo">Select Packaging Photos</button>
        </div>
        <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.bmp,.tif,.tiff" onChange={onFileChange} className="hidden" aria-hidden />
        <div className="text-[11px] text-gray-400 mt-3">Supported: JPG, PNG, WebP, HEIC/HEIF, AVIF, GIF, BMP, TIFF — max 10 MB per image</div>
      </div>
    </div>
  );
}
