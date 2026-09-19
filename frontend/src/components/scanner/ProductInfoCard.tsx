import React from 'react';
import { ProductDetectionResult } from '@/types/ProductDetectionResult';

export default function ProductInfoCard({ result }: { result: ProductDetectionResult }) {
  const ocrStatus = result.ocr?.status ?? 'failed';
  const hasReadableText = !!result.ocr?.rawText && result.ocr.rawText.trim().length > 0;
  const value = (field?: string | null) => field || 'Not detected';

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <h4 className="font-semibold uppercase tracking-wide">Product Information</h4>
      <div className="mt-3 text-sm grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400">Brand</div>
          <div className="font-medium">{value(result.productInfo.brand)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Product Name</div>
          <div className="font-medium">{value(result.productInfo.productName)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">SPF</div>
          <div className="font-medium">{value(result.productInfo.spf)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Batch Number</div>
          <div className="font-medium">{value(result.productInfo.batchNumber)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Manufacturing Date</div>
          <div className="font-medium">{value(result.productInfo.manufacturingDate)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Expiry Date</div>
          <div className="font-medium">{value(result.productInfo.expiryDate)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Detected Date</div>
          <div className="font-medium">{value(result.productInfo.detectedDate)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">MRP / Price</div>
          <div className="font-medium">{value(result.productInfo.mrp)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Ingredients</div>
          <div className="font-medium">{result.productInfo.ingredients?.join(', ') || 'Not detected'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Weight / Volume</div>
          <div className="font-medium">{value(result.productInfo.netWeight || result.productInfo.volume)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Product Features</div>
          <div className="font-medium">{result.productInfo.productFeatures?.join(', ') || 'Not detected'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Barcode</div>
          <div className="font-medium">{result.barcode.detected ? `${result.barcode.format} — ${result.barcode.value}` : 'Not detected'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">QR Code</div>
          <div className="font-medium">{result.qr.detected ? (result.qr.url ?? result.qr.rawValue) : 'Not detected'}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <h4 className="font-semibold uppercase tracking-wide">Detection Results</h4>
        <div className="mt-3 text-sm">
          <div className="text-xs text-gray-400">Product Information Completeness</div>
          <div className="font-medium">{result.productInfo.parserConfidence ?? 0}%</div>
        </div>
        <div className="mt-3 text-xs text-gray-400">OCR Status</div>
        <div className="mt-1 text-sm font-medium">
          {ocrStatus === 'failed' ? 'Failed' : ocrStatus === 'success' ? 'Success' : 'Completed'}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-gray-400">Confidence</div><div>{result.ocr?.confidence == null ? 'Not available' : `${Math.round(result.ocr.confidence * 100)}%`}</div></div>
          <div><div className="text-xs text-gray-400">Processing Time</div><div>{Math.round(result.ocr?.durationMs ?? result.ocrProcessingTimeMs ?? 0)} ms</div></div>
        </div>

        {ocrStatus === 'failed' ? (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-sm text-rose-200">
            <div className="font-semibold">Reason</div>
            <div className="mt-1 break-words">{result.ocr?.error ?? 'OCR failed unexpectedly.'}</div>
          </div>
        ) : ocrStatus === 'success' && hasReadableText ? (
          <>
            <div className="mt-3 text-xs text-gray-400">Raw Extracted Text</div>
            <div className="mt-2 p-3 bg-black/30 rounded text-sm font-mono max-h-40 overflow-auto whitespace-pre-wrap">{result.ocr?.rawText}</div>
          </>
        ) : (
          <div className="mt-3 p-3 bg-white/5 rounded text-sm text-gray-300">No readable text detected in this image.</div>
        )}
      </div>
    </div>
  );
}
