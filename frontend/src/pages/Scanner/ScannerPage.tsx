import { useEffect, useRef, useState } from 'react';
import ScannerUpload, { SelectedFile } from '@/components/scanner/ScannerUpload';
import CameraCapture from '@/components/scanner/CameraCapture';
import ImagePreview from '@/components/scanner/ImagePreview';
import ScannerInstructions from '@/components/scanner/ScannerInstructions';
import ProductAnalyzer from '@/components/scanner/ProductAnalyzer';
import ProductInfoCard from '@/components/scanner/ProductInfoCard';
import ScanResultView from '@/components/scanner/ScanResultView';
import { ProductDetectionResult } from '@/types/ProductDetectionResult';
import { saveScan } from '@/services/scanService';
import { useAuth } from '@/hooks/useAuth';

type State = 'idle' | 'camera' | 'preview' | 'processing' | 'completed' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export default function ScannerPage() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedFileKey = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (selected) URL.revokeObjectURL(selected.url);
    };
  }, [selected]);

  const handleSelect = (s: SelectedFile) => {
    if (selected) URL.revokeObjectURL(selected.url);
    setSelected(s);
    setFileSize(s.file.size);
    setState('preview');
    setError(null);
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleCapture = (blob: Blob) => {
    const file = new File([blob], 'capture.jpg', { type: blob.type });
    const url = URL.createObjectURL(file);
    if (selected) URL.revokeObjectURL(selected.url);
    setSelected({ file, url });
    setFileSize(file.size);
    setState('preview');
    setError(null);
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleRemove = () => {
    if (selected) URL.revokeObjectURL(selected.url);
    setSelected(null);
    setFileSize(undefined);
    setState('idle');
    setSaveState('idle');
    setSaveError(null);
    savedFileKey.current = null;
  };

  const handleRetake = () => {
    // go to camera for retake
    setState('camera');
  };

  const [analysisResult, setAnalysisResult] = useState<ProductDetectionResult | null>(null);

  const handleContinue = () => {
    // start analysis
    setState('processing');
    setAnalysisResult(null);
  };

  const saveAnalysis = async (result: ProductDetectionResult) => {
    if (!currentUser) {
      setSaveState('failed');
      setSaveError('Your session expired. Sign in again before saving this scan.');
      return;
    }

    const fileKey = `${selected?.file.name}:${selected?.file.size}:${selected?.file.lastModified}`;
    if (savedFileKey.current === fileKey) return;
    savedFileKey.current = fileKey;
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveScan(currentUser.uid, result, selected?.file);
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
        <p className="text-sm text-gray-400 mt-1">Upload or capture a clear image of the product packaging to begin verification.</p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              {state === 'idle' && (
                <div>
                  <ScannerUpload onSelect={handleSelect} onError={(m) => { setError(m); setState('error'); }} />
                  <div className="mt-4">
                    <button onClick={() => setState('camera')} className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold" aria-label="Take photo">Take Photo</button>
                  </div>
                </div>
              )}

              {state === 'camera' && (
                <CameraCapture onCapture={handleCapture} onError={(m) => { setError(m); setState('error'); }} onClose={() => setState('idle')} />
              )}

              {state === 'preview' && selected && (
                <ImagePreview url={selected.url} fileName={selected.file.name} fileSize={fileSize} onRetake={handleRetake} onRemove={handleRemove} onContinue={handleContinue} />
              )}

              {state === 'processing' && selected && (
                <div>
                  <ProductAnalyzer file={selected} onComplete={handleAnalysisComplete} />
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
                  <div className="mt-3"><button onClick={() => { setError(null); setState('idle'); }} className="px-3 py-1 rounded bg-white/5">Dismiss</button></div>
                </div>
              )}
            </div>

            <div>
              <ScannerInstructions />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="p-4 bg-white/3 rounded-lg text-center">
              <div className="text-sm text-gray-300">Preview</div>
              {selected ? (
                <img src={selected.url} alt="preview" className="w-full h-48 object-contain mt-3 rounded" />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 mt-3">No image selected</div>
              )}
            </div>

            <div className="p-4 bg-white/3 rounded-lg">
              <div className="text-sm text-gray-300">Need help?</div>
              <div className="text-xs text-gray-400 mt-2">Tips: center product, good lighting, avoid glare.</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
