import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Camera, Layers } from 'lucide-react';
import type { SelectedFile } from './ScannerUpload';

export interface ImagePreviewProps {
  url?: string;
  fileName?: string;
  fileSize?: number;
  primary?: SelectedFile;
  secondary?: SelectedFile | null;
  onRetake?: () => void;
  onRemove?: () => void;
  onAddSecondary?: () => void;
  onRemoveSecondary?: () => void;
  onContinue: () => void;
}

export default function ImagePreview({
  url,
  fileName,
  fileSize,
  primary,
  secondary,
  onRetake,
  onRemove,
  onAddSecondary,
  onRemoveSecondary,
  onContinue
}: ImagePreviewProps) {
  // Support both new dual-file props and legacy single-url props
  const primaryFile = primary || (url ? { file: { name: fileName || 'Captured Image', size: fileSize || 0 } as File, url } : null);

  const humanSize = (n?: number) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!primaryFile) return null;

  return (
    <div className="space-y-5">
      {/* Visual Header Indicator */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-400 border-b border-white/5 pb-2">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Layers className="w-3.5 h-3.5" />
          {secondary ? 'DUAL-FACE VERIFICATION PREPARATION' : 'SINGLE-FACE VERIFICATION'}
        </span>
        <span>{secondary ? '2 Packaging Faces Selected' : '1 Packaging Face Selected'}</span>
      </div>

      {/* Image Previews: 1 or 2 side-by-side */}
      <div className={`grid gap-4 ${secondary ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Primary / Front Face */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300">Face 1 (Front / Label)</span>
            <span className="text-[11px] text-gray-400">{humanSize(primaryFile.file.size)}</span>
          </div>
          <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 relative group">
            <img src={primaryFile.url} alt="Primary packaging face" className="w-full h-64 object-contain bg-black" />
          </div>
          <div className="text-[11px] text-gray-400 truncate">{primaryFile.file.name}</div>
        </div>

        {/* Secondary / Reverse Face (if present) */}
        {secondary && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-violet-300">Face 2 (Back / Barcode)</span>
              <button
                onClick={onRemoveSecondary}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                title="Remove reverse face"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 relative">
              <img src={secondary.url} alt="Secondary packaging face" className="w-full h-64 object-contain bg-black" />
            </div>
            <div className="text-[11px] text-gray-400 truncate">{secondary.file.name}</div>
          </div>
        )}
      </div>

      {/* Add Back Face Callout (if only 1 image selected) */}
      {!secondary && onAddSecondary && (
        <div className="p-3.5 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-300">
            <span className="font-semibold text-white block">Have barcode or batch on the reverse side?</span>
            Add the back face to verify barcode & batch together with front branding.
          </div>
          <button
            onClick={onAddSecondary}
            className="px-3.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Back Face</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
        {onRetake && (
          <button onClick={onRetake} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">
            Retake Photo
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium transition">
            Clear Selection
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onContinue}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-bold text-xs shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.02]"
        >
          {secondary ? 'Analyze Both Faces' : 'Continue to Verification'}
        </button>
      </div>
    </div>
  );
}
