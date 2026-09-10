import React, { useRef, useState, DragEvent } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface SelectedFile {
  file: File;
  url: string;
}

export default function ScannerUpload({ onSelect, onError }: { onSelect: (f: SelectedFile) => void; onError: (msg: string) => void; }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const validateAndSend = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('Unsupported file type. Please use JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError('File is too large. Maximum size is 10 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    onSelect({ file, url });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSend(file);
    // reset value so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSend(file);
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
        <div className="text-lg font-semibold">Drag & drop image here</div>
        <div className="text-sm text-gray-400 mt-1">or</div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => { inputRef.current?.click(); }} className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold" aria-label="Upload image">Upload Image</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" aria-hidden />
        <div className="text-xs text-gray-400 mt-3">Supports JPG, PNG, WEBP — max 10 MB</div>
      </div>
    </div>
  );
}
