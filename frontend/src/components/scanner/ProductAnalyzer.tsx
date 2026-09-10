import React, { useEffect, useState } from 'react';
import { SelectedFile } from './ScannerUpload';
import { detectBarcodeFromImage } from '@/services/scanner/barcodeService';
import { performOCR } from '@/services/scanner/ocrService';
import { parseProductInfo } from '@/services/scanner/productParser';
import { ProductDetectionResult } from '@/types/ProductDetectionResult';

export default function ProductAnalyzer({ file, onComplete }: { file: SelectedFile; onComplete: (res: ProductDetectionResult) => void; }) {
  const [status, setStatus] = useState<string>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const start = performance.now();
      const analysisErrors: string[] = [];
      setErrors([]);
      setStatus('Loading image...');

      try {
        const img = document.createElement('img');
        img.src = file.url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image failed to load'));
        });

        setStatus('Detecting QR code...');
        let barcodeResult = null;
        try {
          barcodeResult = await detectBarcodeFromImage(img);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          analysisErrors.push(`Barcode detection failed: ${message}`);
          setErrors([...analysisErrors]);
        }

        setStatus('Initializing OCR engine...');
        let ocrResult: { text: string; confidence: number | null } | null = null;
        let ocrStatus: 'success' | 'completed' | 'failed' = 'completed';
        let ocrError: string | null = null;
        let ocrProcessingTimeMs = 0;

        try {
          const ocrStart = performance.now();
          ocrResult = await performOCR(file.file, (progress, progressStatus) => {
            const normalizedProgress = typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : 0;
            const percentage = Math.round(normalizedProgress * 100);

            if (progressStatus && progressStatus.toLowerCase().includes('loading')) {
              setStatus('Loading English language...');
              return;
            }

            if (progressStatus && progressStatus.toLowerCase().includes('recognize')) {
              setStatus('Recognizing product text...');
              return;
            }

            if (percentage > 0) {
              setStatus(`OCR progress: ${percentage}%`);
            }
          });
          ocrProcessingTimeMs = performance.now() - ocrStart;
          console.debug('[OCR] Time:', ocrProcessingTimeMs);

          if (ocrResult.text.trim()) {
            ocrStatus = 'success';
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          ocrError = `OCR failed: ${message}`;
          analysisErrors.push(ocrError);
          setErrors([...analysisErrors]);
          ocrStatus = 'failed';
        }

        const rawText = ocrResult?.text ?? '';
        const productInfo = rawText.trim() ? parseProductInfo(rawText) : {};

        const result: ProductDetectionResult = {
          imageUrl: file.url,
          processingTimeMs: Math.round(performance.now() - start),
          ocrProcessingTimeMs,
          qr: {
            detected: !!barcodeResult && barcodeResult.format === 'QR_CODE',
            rawValue: barcodeResult ? barcodeResult.value : null,
            url: barcodeResult && barcodeResult.value && /^https?:\/\//i.test(barcodeResult.value) ? barcodeResult.value : null
          },
          barcode: {
            detected: !!barcodeResult && barcodeResult.format !== 'QR_CODE',
            format: barcodeResult ? barcodeResult.format : null,
            value: barcodeResult ? barcodeResult.value : null
          },
          ocr: {
            status: ocrStatus,
            rawText,
            confidence: ocrResult?.confidence ?? null,
            error: ocrError
          },
          productInfo,
          errors: analysisErrors
        };

        if (!cancelled) {
          setStatus('Analysis complete');
          onComplete(result);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        analysisErrors.push(message);
        setErrors([...analysisErrors]);
        setStatus('Error');
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [file]);

  return (
    <div className="p-4 bg-white/5 rounded">
      <div className="text-sm text-gray-300">Analysis status: {status}</div>
      {errors.length > 0 && (
        <div className="mt-2 text-xs text-rose-300">{errors.join('; ')}</div>
      )}
    </div>
  );
}
