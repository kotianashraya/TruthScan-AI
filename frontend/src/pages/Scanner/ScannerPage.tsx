import React, { useEffect, useRef, useState } from 'react';
import ScannerUpload, { SelectedFile } from '@/components/scanner/ScannerUpload';
import CameraCapture from '@/components/scanner/CameraCapture';
import ImagePreview from '@/components/scanner/ImagePreview';
import ScannerInstructions from '@/components/scanner/ScannerInstructions';
import ProductAnalyzer from '@/components/scanner/ProductAnalyzer';
import ScanResultView from '@/components/scanner/ScanResultView';
import { ProductDetectionResult } from '@/types/ProductDetectionResult';
import { saveScan } from '@/services/scanService';
import { useAuth } from '@/hooks/useAuth';
import { normalizeImageFile, validateImageFile } from '@/services/scanner/imageNormalization';

type State = 'idle' | 'camera' | 'preview' | 'processing' | 'completed' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export default function ScannerPage() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [cameraTarget, setCameraTarget] = useState<'primary' | 'secondary'>('primary');
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedFileKey = useRef<string | null>(null);
  const secondaryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [selectedFiles]);

  const handleSelect = (s: SelectedFile | SelectedFile[]) => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    const newFiles = Array.isArray(s) ? s : [s];
    setSelectedFiles(newFiles);
    setState('preview');
    setError(null);
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleCapture = (blob: Blob) => {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type });
    const url = URL.createObjectURL(file);
    const newFile: SelectedFile = { file, url };

    if (cameraTarget === 'secondary' && selectedFiles.length > 0) {
      setSelectedFiles([selectedFiles[0], newFile]);
    } else {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));
      setSelectedFiles([newFile]);
    }
    setCameraTarget('primary');
    setState('preview');
    setError(null);
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleSecondaryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationErr = validateImageFile(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    try {
      const normalized = await normalizeImageFile(file);
      const url = URL.createObjectURL(normalized);
      const newFile: SelectedFile = { file: normalized, url };
      setSelectedFiles((prev) => (prev.length > 0 ? [prev[0], newFile] : [newFile]));
      setError(null);
    } catch {
      setError('Unable to process secondary packaging image. Please try JPG, PNG, or WebP.');
    } finally {
      if (secondaryInputRef.current) secondaryInputRef.current.value = '';
    }
  };

  const handleRemoveSecondary = () => {
    if (selectedFiles.length > 1) {
      URL.revokeObjectURL(selectedFiles[1].url);
      setSelectedFiles([selectedFiles[0]]);
    }
  };

  const handleRemove = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setSelectedFiles([]);
    setState('idle');
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleRetake = () => {
    setCameraTarget('primary');
    setState('camera');
  };

  const [analysisResult, setAnalysisResult] = useState<ProductDetectionResult | null>(null);

  const handleContinue = () => {
    setState('processing');
    setAnalysisResult(null);
  };

  const saveAnalysis = async (result: ProductDetectionResult) => {
    if (!currentUser) {
      setSaveState('failed');
      setSaveError('Your session expired. Sign in again before saving this scan.');
      return;
    }

    const primary = selectedFiles[0];
    const fileKey = selectedFiles
      .map((s) => `${s.file.name}:${s.file.size}:${s.file.lastModified}`)
      .join('|');
    if (savedFileKey.current === fileKey) return;
    savedFileKey.current = fileKey;
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveScan(currentUser.uid, result, primary?.file);
      setSaveState('saved');
    } catch (saveFailure) {
      savedFileKey.current = null;
      setSaveState('failed');
      setSaveError('The scan was analyzed, but it could not be saved to Firestore. Please retry.');
      console.error('[SCANNER] scan save failed', saveFailure);
    }
  };

  const handleAnalysisComplete = (result: ProductDetectionResult) => {
    setAnalysisResult(result);
    setState('completed');
    void saveAnalysis(result);
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-semibold">Product Scanner</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload or capture clear photos of packaging (front label and/or reverse side with barcode) to begin verification.
        </p>

        {/* Hidden input for secondary face selection */}
        <input
          ref={secondaryInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => void handleSecondaryFileSelect(e)}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              {state === 'idle' && (
                <div>
                  <ScannerUpload
                    onSelect={handleSelect}
                    onError={(m) => {
                      setError(m);
                      setState('error');
                    }}
                  />
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setCameraTarget('primary');
                        setState('camera');
                      }}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
                      aria-label="Take photo"
                    >
                      Take Photo
                    </button>
                  </div>
                </div>
              )}

              {state === 'camera' && (
                <CameraCapture
                  onCapture={handleCapture}
                  onError={(m) => {
                    setError(m);
                    setState('error');
                  }}
                  onClose={() => setState(selectedFiles.length > 0 ? 'preview' : 'idle')}
                />
              )}

              {state === 'preview' && selectedFiles.length > 0 && (
                <ImagePreview
                  primary={selectedFiles[0]}
                  secondary={selectedFiles[1] || null}
                  onRetake={handleRetake}
                  onRemove={handleRemove}
                  onAddSecondary={() => secondaryInputRef.current?.click()}
                  onRemoveSecondary={handleRemoveSecondary}
                  onContinue={handleContinue}
                />
              )}

              {state === 'processing' && selectedFiles.length > 0 && (
                <div>
                  <ProductAnalyzer files={selectedFiles} onComplete={handleAnalysisComplete} />
                </div>
              )}

              {state === 'completed' && analysisResult && (
                <ScanResultView
                  result={analysisResult}
                  onScanAgain={handleRemove}
                  saveStatus={saveState}
                  saveError={saveError}
                  onRetrySave={() => void saveAnalysis(analysisResult)}
                />
              )}

              {state === 'error' && (
                <div className="p-4 bg-rose-900/40 rounded">
                  <div className="font-semibold">Error</div>
                  <div className="text-sm text-gray-200 mt-1">{error}</div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setError(null);
                        setState(selectedFiles.length > 0 ? 'preview' : 'idle');
                      }}
                      className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 transition text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <ScannerInstructions />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="p-4 bg-white/3 rounded-lg text-center">
              <div className="text-sm text-gray-300">
                Preview {selectedFiles.length > 1 ? `(${selectedFiles.length} Faces)` : ''}
              </div>
              {selectedFiles.length > 0 ? (
                <div className="space-y-2.5 mt-3">
                  {selectedFiles.map((s, idx) => (
                    <div key={idx} className="relative rounded overflow-hidden bg-black/40 border border-white/5">
                      <img
                        src={s.url}
                        alt={`Face ${idx + 1}`}
                        className="w-full h-36 object-contain"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/80 text-gray-300">
                        {idx === 0 ? 'Face 1 (Front)' : 'Face 2 (Back)'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 mt-3">
                  No image selected
                </div>
              )}
            </div>

            <div className="p-4 bg-white/3 rounded-lg">
              <div className="text-sm text-gray-300">Need help?</div>
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <p>• Center packaging under good lighting.</p>
                <p>• Avoid glare and shadows on barcodes.</p>
                <p>• If barcode is on the back, upload both front and back faces.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
