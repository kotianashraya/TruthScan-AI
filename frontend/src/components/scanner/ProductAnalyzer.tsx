import React, { useEffect, useState } from 'react';
import { BarcodeFormat } from '@zxing/library';
import { SelectedFile } from './ScannerUpload';
import { detectBarcodeWithDiagnostics, type DetectedBarcode } from '@/services/scanner/barcodeService';
import { performOCR } from '@/services/scanner/ocrService';
import { parseProductInfo } from '@/services/scanner/productParser';
import { verifyAgainstDatabase } from '@/services/scanner/productDatabase';
import { evaluateAuthenticity } from '@/services/scanner/authenticityEngine';
import { analyzeProductVision } from '@/services/scanner/geminiVisionService';
import type { VisionAssessment } from '@/types/VisionAssessment';
import {
  ProductDetectionResult,
  ProductInfo,
  BarcodeResult,
  QRResult,
  OCRResult
} from '@/types/ProductDetectionResult';

export interface ProductAnalyzerProps {
  file?: SelectedFile;
  files?: SelectedFile[];
  onComplete: (res: ProductDetectionResult) => void;
}

async function analyzeFace(
  selected: SelectedFile,
  faceLabel: string,
  onStatus: (s: string) => void,
  analysisErrors: string[]
) {
  onStatus(`Loading ${faceLabel}...`);
  const imageLoadStart = performance.now();
  const img = document.createElement('img');
  img.src = selected.url;

  await new Promise<void>((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`${faceLabel} failed to load`));
  });

  if ('decode' in img) {
    try {
      await (img as any).decode();
    } catch {
      // Non-fatal if already cached/decoded
    }
  }
  const imageLoadingTimeMs = performance.now() - imageLoadStart;

  // 1. QR Detection
  onStatus(`Scanning QR code on ${faceLabel}...`);
  const qrStart = performance.now();
  let qrResult: DetectedBarcode | null = null;
  try {
    const { result } = await detectBarcodeWithDiagnostics(img, [BarcodeFormat.QR_CODE]);
    qrResult = result;
  } catch (err) {
    console.debug(`[Scanner] QR detection on ${faceLabel} skipped:`, err);
  }
  const qrDetectionTimeMs = performance.now() - qrStart;

  // 2. Barcode Detection
  onStatus(`Scanning barcode on ${faceLabel}...`);
  const barcodeStart = performance.now();
  let barcodeResult: DetectedBarcode | null = null;
  try {
    const { result, diagnostics } = await detectBarcodeWithDiagnostics(img, [
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
    barcodeResult = result;
    if (result) {
      console.info(`[Scanner] Barcode detected on ${faceLabel}:`, result.format, result.value);
    } else {
      console.debug(`[Scanner] Barcode not detected on ${faceLabel}:`, diagnostics.status);
    }
    if (diagnostics.status === 'FAILED') {
      analysisErrors.push(`${faceLabel}: ${diagnostics.userMessage}`);
    }
  } catch (err) {
    console.warn(`[Scanner] Barcode issue on ${faceLabel}:`, err);
    analysisErrors.push(`Barcode processing on ${faceLabel} encountered an issue.`);
  }
  const barcodeDetectionTimeMs = performance.now() - barcodeStart;

  // 3. OCR Text Extraction
  onStatus(`Extracting text from ${faceLabel}...`);
  let ocrResult = null;
  let ocrError: string | null = null;
  let ocrProcessingTimeMs = 0;
  try {
    const ocrStart = performance.now();
    ocrResult = await performOCR(selected.file, (progress, progressStatus) => {
      const pct = Math.round(Math.max(0, Math.min(1, progress || 0)) * 100);
      if (pct > 0) onStatus(`${faceLabel} OCR: ${pct}%`);
    });
    ocrProcessingTimeMs = performance.now() - ocrStart;
  } catch (err) {
    console.error(`[OCR] error on ${faceLabel}`, err);
    ocrError = `OCR failed on ${faceLabel}.`;
    analysisErrors.push(ocrError);
  }

  const rawText = ocrResult?.text ?? '';
  const productInfo = rawText.trim() ? parseProductInfo(rawText) : {};

  return {
    qrResult,
    barcodeResult,
    ocrResult,
    ocrError,
    ocrProcessingTimeMs,
    rawText,
    productInfo,
    imageLoadingTimeMs,
    qrDetectionTimeMs,
    barcodeDetectionTimeMs
  };
}

export default function ProductAnalyzer({
  file,
  files,
  onComplete
}: ProductAnalyzerProps) {
  const [status, setStatus] = useState<string>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const activeFiles = files && files.length > 0 ? files : file ? [file] : [];
    if (!activeFiles.length) return;

    const run = async () => {
      const start = performance.now();
      const analysisErrors: string[] = [];
      setErrors([]);

      try {
        // Face 1 (Primary / Front)
        const face1 = await analyzeFace(
          activeFiles[0],
          activeFiles.length > 1 ? 'Face 1 (Front)' : 'Packaging face',
          setStatus,
          analysisErrors
        );

        // Face 2 (Secondary / Back - if provided)
        let face2 = null;
        if (activeFiles.length > 1) {
          face2 = await analyzeFace(
            activeFiles[1],
            'Face 2 (Back)',
            setStatus,
            analysisErrors
          );
        }

        // Merge Barcode signals: Prioritize 1D barcode detected on either face
        const detectedBarcode = (face2?.barcodeResult && face2.barcodeResult.format !== 'QR_CODE')
          ? face2.barcodeResult
          : (face1.barcodeResult && face1.barcodeResult.format !== 'QR_CODE')
            ? face1.barcodeResult
            : null;

        const barcodeData: BarcodeResult = {
          detected: !!detectedBarcode,
          format: detectedBarcode ? detectedBarcode.format : null,
          value: detectedBarcode ? detectedBarcode.value : null
        };

        // Merge QR signals
        const detectedQR = (face1.qrResult && face1.qrResult.format === 'QR_CODE')
          ? face1.qrResult
          : (face2?.qrResult && face2.qrResult.format === 'QR_CODE')
            ? face2.qrResult
            : null;

        const qrData: QRResult = {
          detected: !!detectedQR,
          rawValue: detectedQR ? detectedQR.value : null,
          url: detectedQR && detectedQR.value && /^https?:\/\//i.test(detectedQR.value) ? detectedQR.value : null
        };

        // Merge OCR text
        const combinedRawText = face2
          ? `${face1.rawText}\n\n[REVERSE PACKAGING FACE]:\n${face2.rawText}`.trim()
          : face1.rawText;

        const ocrStatus = (face1.rawText || face2?.rawText)
          ? 'success'
          : (face1.ocrError && (!face2 || face2.ocrError))
            ? 'failed'
            : 'completed';

        const avgConfidence = face2
          ? ((face1.ocrResult?.confidence ?? 0) + (face2.ocrResult?.confidence ?? 0)) / 2
          : face1.ocrResult?.confidence ?? null;

        const ocrData: OCRResult = {
          status: ocrStatus,
          rawText: combinedRawText,
          confidence: avgConfidence,
          durationMs: face1.ocrProcessingTimeMs + (face2?.ocrProcessingTimeMs ?? 0),
          error: face1.ocrError || face2?.ocrError || null
        };

        // Merge Product Information (Front brand/name + Rear batch/dates/price)
        const p1 = face1.productInfo;
        const p2 = face2?.productInfo ?? {};
        const mergedProductInfo: ProductInfo = {
          brand: p1.brand || p2.brand || null,
          productName: p1.productName || p2.productName || null,
          productType: p1.productType || p2.productType || null,
          variant: p1.variant || p2.variant || null,
          quantity: p1.quantity || p2.quantity || null,
          netWeight: p1.netWeight || p2.netWeight || null,
          volume: p1.volume || p2.volume || null,
          manufacturer: p1.manufacturer || p2.manufacturer || null,
          countryOfOrigin: p1.countryOfOrigin || p2.countryOfOrigin || null,
          batchNumber: p2.batchNumber || p1.batchNumber || null,
          lotNumber: p2.lotNumber || p1.lotNumber || null,
          mrp: p2.mrp || p1.mrp || null,
          manufacturingDate: p2.manufacturingDate || p1.manufacturingDate || null,
          expiryDate: p2.expiryDate || p1.expiryDate || null,
          detectedDate: p2.detectedDate || p1.detectedDate || null,
          ingredients: Array.from(new Set([...(p1.ingredients || []), ...(p2.ingredients || [])]))
        };

        // Database Catalog Check
        setStatus('Cross-referencing product catalog...');
        const dbStart = performance.now();
        const databaseVerification = verifyAgainstDatabase(mergedProductInfo, barcodeData);
        const databaseVerificationTimeMs = performance.now() - dbStart;

        // Multimodal AI Vision (supporting evidence)
        setStatus('Running multimodal AI vision assessment...');
        let visionAssessment: VisionAssessment;
        try {
          visionAssessment = await analyzeProductVision(activeFiles[0].file, {
            ocrText: combinedRawText,
            ocrConfidence: avgConfidence,
            productInfo: mergedProductInfo,
            barcode: barcodeData,
            qr: qrData
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn('[AI Vision] unavailable; continuing deterministic verification', message);
          visionAssessment = {
            status: 'UNAVAILABLE',
            confidence: 0,
            packagingConsistency: 'NOT_ASSESSABLE',
            aiRiskHint: 'INCONCLUSIVE',
            packagingObservations: [],
            positiveVisualIndicators: [],
            visualWarningIndicators: [],
            visibleTextIssues: [],
            tamperEvidence: [],
            limitations: ['Multimodal AI vision could not be completed for this scan.'],
            error: message
          };
        }

        // Authenticity Engine Evaluation
        setStatus('Evaluating product authenticity signals...');
        const authStart = performance.now();
        const partialResult: ProductDetectionResult = {
          imageUrl: activeFiles[0].url,
          processingTimeMs: Math.round(performance.now() - start),
          ocrProcessingTimeMs: ocrData.durationMs,
          timings: {
            imageLoadingTimeMs: face1.imageLoadingTimeMs + (face2?.imageLoadingTimeMs ?? 0),
            qrDetectionTimeMs: face1.qrDetectionTimeMs + (face2?.qrDetectionTimeMs ?? 0),
            barcodeDetectionTimeMs: face1.barcodeDetectionTimeMs + (face2?.barcodeDetectionTimeMs ?? 0),
            ocrInitializationTimeMs: face1.ocrResult?.initializationTimeMs ?? 0,
            ocrPreprocessingTimeMs: face1.ocrResult?.preprocessingTimeMs ?? 0,
            ocrRecognitionTimeMs: face1.ocrResult?.recognitionTimeMs ?? 0,
            productParsingTimeMs: 0,
            databaseVerificationTimeMs
          },
          qr: qrData,
          barcode: barcodeData,
          ocr: ocrData,
          productInfo: mergedProductInfo,
          databaseVerification,
          visionAssessment,
          errors: analysisErrors
        };

        const authenticity = evaluateAuthenticity(partialResult);
        const authenticityEvaluationTimeMs = performance.now() - authStart;

        // Note dual-face evidence if applicable
        if (activeFiles.length > 1) {
          authenticity.evidence.unshift('Dual-face packaging analysis completed (Front and Rear packaging faces evaluated).');
          if (detectedBarcode) {
            authenticity.positiveIndicators.push(`Barcode verified across packaging face: ${detectedBarcode.format} (${detectedBarcode.value})`);
          }
        }

        const finalResult: ProductDetectionResult = {
          ...partialResult,
          timings: {
            ...partialResult.timings!,
            authenticityEvaluationTimeMs
          },
          authenticity
        };

        if (!cancelled) {
          setStatus('Analysis complete');
          onComplete(finalResult);
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
  }, [file, files]);

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
      <div className="text-sm text-cyan-300 font-medium flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>Status: {status}</span>
      </div>
      {errors.length > 0 && (
        <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          {errors.join('; ')}
        </div>
      )}
    </div>
  );
}
