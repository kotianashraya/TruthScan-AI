import React, { useEffect, useState } from 'react';

export default function ImagePreview({ url, fileName, fileSize, onRetake, onRemove, onContinue }: { url: string; fileName?: string; fileSize?: number; onRetake: () => void; onRemove: () => void; onContinue: () => void; }) {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setDimensions(null);
    img.src = url;
    return () => { /* no-op */ };
  }, [url]);

  const humanSize = (n?: number) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden bg-black/60 border border-white/10">
        <img src={url} alt="Selected product" className="w-full h-80 object-contain bg-black" />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-400">File</div>
          <div className="font-medium">{fileName ?? 'Captured Image'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Size</div>
          <div className="font-medium">{humanSize(fileSize)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Dimensions</div>
          <div className="font-medium">{dimensions ? `${dimensions.w} × ${dimensions.h}` : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Status</div>
          <div className="font-medium">Image ready</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onRetake} className="px-4 py-2 rounded-lg bg-white/5">Retake</button>
        <button onClick={onRemove} className="px-4 py-2 rounded-lg bg-rose-600/80 text-white">Remove</button>
        <div className="flex-1" />
        <button onClick={onContinue} className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold">Continue Analysis</button>
      </div>
    </div>
  );
}
