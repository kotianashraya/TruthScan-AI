import React, { useEffect, useState } from 'react';
import { BarcodeFormat } from '@zxing/library';
import { SelectedFile } from './ScannerUpload';
import { detectBarcodeFromImage } from '@/services/scanner/barcodeService';
import { performOCR } from '@/services/scanner/ocrService';
import { parseProductInfo } from '@/services/scanner/productParser';
import { verifyAgainstDatabase } from '@/services/scanner/productDatabase';
import { evaluateAuthenticity } from '@/services/scanner/authenticityEngine';
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
        const imageLoadStart = performance.now();
        const img = document.createElement('img');
        img.src = file.url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image failed to load'));
        });
        const imageLoadingTimeMs = performance.now() - imageLoadStart;

        setStatus('Scanning QR code...');
        const qrStart = performance.now();
        let qrResult = null;
        try {
          qrResult = await detectBarcodeFromImage(img, [BarcodeFormat.QR_CODE]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          analysisErrors.push(`QR detection failed: ${message}`);
          setErrors([...analysisErrors]);
        }
        const qrDetectionTimeMs = performance.now() - qrStart;
        if (!qrResult) console.debug('[Scanner] QR not detected; continuing to barcode');

        setStatus('Scanning barcode...');
        const barcodeStart = performance.now();
        let barcodeResult = null;
        try {
          barcodeResult = await detectBarcodeFromImage(img, [
            BarcodeFormat.AZTEC,
            BarcodeFormat.CODABAR,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.CODE_128,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.EAN_8,
            BarcodeFormat.EAN_13,
            BarcodeFormat.ITF,
            BarcodeFormat.PDF_417,
            BarcodeFormat.RSS_14,
            BarcodeFormat.RSS_EXPANDED,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.UPC_EAN_EXTENSION,
            BarcodeFormat.MAXICODE
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          analysisErrors.push(`Barcode detection failed: ${message}`);
          setErrors([...analysisErrors]);
        }
        const barcodeDetectionTimeMs = performance.now() - barcodeStart;
        if (!barcodeResult) console.debug('[Scanner] Barcode not detected; continuing to OCR');
        console.debug('[Scanner] QR detection time:', qrDetectionTimeMs, 'ms');
        console.debug('[Scanner] Barcode detection time:', barcodeDetectionTimeMs, 'ms');

        setStatus('Extracting product text...');
        let ocrResult: {
          text: string;
          confidence: number | null;
          initializationTimeMs: number;
          preprocessingTimeMs: number;
          recognitionTimeMs: number;
        } | null = null;
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
          console.debug('[OCR] initialization time:', ocrResult.initializationTimeMs, 'ms');
          console.debug('[OCR] recognition time:', ocrResult.recognitionTimeMs, 'ms');
          console.debug('[OCR] total time:', ocrProcessingTimeMs, 'ms');

          if (ocrResult.text.trim()) {
            ocrStatus = 'success';
          }
        } catch (error) {
          console.error('[OCR] analyzer error', error);
          ocrError = 'OCR could not process this image. Please try a clearer image.';
          analysisErrors.push(ocrError);
          setErrors([...analysisErrors]);
          ocrStatus = 'failed';
        }

        const rawText = ocrResult?.text ?? '';
        const parserStart = performance.now();
        setStatus('Parsing product information...');
        const productInfo = rawText.trim() ? parseProductInfo(rawText) : {};
        const productParsingTimeMs = performance.now() - parserStart;
        console.debug('[Scanner] product parsing time:', productParsingTimeMs, 'ms');

        const barcodeData = {
          detected: !!barcodeResult && barcodeResult.format !== 'QR_CODE',
          format: barcodeResult ? barcodeResult.format : null,
          value: barcodeResult ? barcodeResult.value : null
        };

        const qrData = {
          detected: !!qrResult && qrResult.format === 'QR_CODE',
          rawValue: qrResult ? qrResult.value : null,
          url: qrResult && qrResult.value && /^https?:\/\//i.test(qrResult.value) ? qrResult.value : null
        };

        setStatus('Cross-referencing product catalog...');
        const dbStart = performance.now();
        const databaseVerification = verifyAgainstDatabase(productInfo, barcodeData);
        const databaseVerificationTimeMs = performance.now() - dbStart;

        const partialResult: ProductDetectionResult = {
          imageUrl: file.url,
          processingTimeMs: Math.round(performance.now() - start),
          ocrProcessingTimeMs,
          timings: {
            imageLoadingTimeMs,
            qrDetectionTimeMs,
            barcodeDetectionTimeMs,
            ocrInitializationTimeMs: ocrResult?.initializationTimeMs ?? 0,
            ocrPreprocessingTimeMs: ocrResult?.preprocessingTimeMs ?? 0,
            ocrRecognitionTimeMs: ocrResult?.recognitionTimeMs ?? 0,
            productParsingTimeMs,
            databaseVerificationTimeMs
          },
          qr: qrData,
          barcode: barcodeData,
          ocr: {
            status: ocrStatus,
            rawText,
            confidence: ocrResult?.confidence ?? null,
            durationMs: ocrProcessingTimeMs,
            error: ocrError
          },
          productInfo,
          databaseVerification,
          errors: analysisErrors
        };

        setStatus('Running AI authenticity evaluation...');
        const authStart = performance.now();
        const authenticity = evaluateAuthenticity(partialResult);
        const authenticityEvaluationTimeMs = performance.now() - authStart;

        const result: ProductDetectionResult = {
          ...partialResult,
          processingTimeMs: Math.round(performance.now() - start),
          timings: {
            ...partialResult.timings!,
            authenticityEvaluationTimeMs
          },
          authenticity
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
