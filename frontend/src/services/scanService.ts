import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/firebase';
import type { ProductDetectionResult } from '@/types/ProductDetectionResult';
import type { ScanRecord } from '@/types/ScanRecord';

const scansCollection = collection(db, 'scans');

function toScanData(uid: string, result: ProductDetectionResult) {
  return {
    uid,
    scanStatus: 'completed' as const,
    authenticityStatus: null,
    authenticityScore: null,
    createdAt: serverTimestamp(),
    imageUrl: null,
    processingTimeMs: result.processingTimeMs,
    ocrProcessingTimeMs: result.ocrProcessingTimeMs ?? null,
    timings: result.timings ?? null,
    qr: result.qr,
    barcode: result.barcode,
    ocr: result.ocr,
    productInfo: result.productInfo,
    errors: result.errors,
  };
}

export async function saveScan(uid: string, result: ProductDetectionResult) {
  const reference = await addDoc(scansCollection, toScanData(uid, result));
  return reference.id;
}

export async function getUserScans(uid: string): Promise<ScanRecord[]> {
  const snapshot = await getDocs(query(scansCollection, where('uid', '==', uid)));
  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() } as ScanRecord))
    .sort((left, right) => timestampValue(right.createdAt) - timestampValue(left.createdAt));
}

function timestampValue(value: unknown) {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime();
  return 0;
}

export function formatScanDate(value: unknown) {
  const time = timestampValue(value);
  return time ? new Date(time).toLocaleString() : 'Pending timestamp';
}