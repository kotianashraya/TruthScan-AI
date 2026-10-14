import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/firebase';
import type { ProductDetectionResult } from '@/types/ProductDetectionResult';
import type { ScanRecord } from '@/types/ScanRecord';

const scansCollection = collection(db, 'scans');

export async function uploadScanImage(uid: string, file: File | Blob): Promise<string | null> {
  try {
    if (!storage) return null;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    const storageRef = ref(storage, `users/${uid}/scans/${filename}`);
    const metadata = { contentType: file.type || 'image/jpeg' };
    await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(storageRef);
  } catch (error) {
    // If storage is not enabled or network fails, log and continue safely
    console.warn('[STORAGE] image upload skipped or unavailable', error);
    return null;
  }
}

function toScanData(uid: string, result: ProductDetectionResult, storedImageUrl?: string | null) {
  const authRes = result.authenticity;
  return {
    uid,
    userId: uid,
    scanStatus: 'completed' as const,
    authenticityStatus: authRes?.status ?? null,
    authenticityScore: authRes?.authenticityScore ?? null,
    riskLevel: authRes?.riskLevel ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    imageUrl: storedImageUrl ?? (typeof result.imageUrl === 'string' && result.imageUrl.startsWith('http') ? result.imageUrl : null),
    processingTimeMs: result.processingTimeMs,
    ocrProcessingTimeMs: result.ocrProcessingTimeMs ?? null,
    timings: result.timings ?? null,
    qr: result.qr,
    barcode: result.barcode,
    ocr: result.ocr,
    productInfo: result.productInfo,
    databaseVerification: result.databaseVerification ?? null,
    authenticity: authRes ?? null,
    errors: result.errors,
  };
}

export async function saveScan(
  uid: string,
  result: ProductDetectionResult,
  imageFile?: File | Blob
): Promise<string> {
  let storedImageUrl: string | null = null;
  if (imageFile) {
    storedImageUrl = await uploadScanImage(uid, imageFile);
  }

  const scanData = toScanData(uid, result, storedImageUrl);
  const reference = await addDoc(scansCollection, scanData);

  // Update user stats in users/{uid}
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      totalScans: increment(1),
      scansUsed: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Not fatal if user profile document update fails or is in progress
  }

  return reference.id;
}

export async function getScanById(scanId: string): Promise<ScanRecord | null> {
  const scanRef = doc(db, 'scans', scanId);
  const snapshot = await getDoc(scanRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as ScanRecord;
}

export async function deleteScan(scanId: string): Promise<void> {
  const scanRef = doc(db, 'scans', scanId);
  await deleteDoc(scanRef);
}

export async function getUserScans(uid: string): Promise<ScanRecord[]> {
  const snapshot = await getDocs(query(scansCollection, where('uid', '==', uid)));
  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() } as ScanRecord))
    .sort((left, right) => timestampValue(right.createdAt) - timestampValue(left.createdAt));
}

function timestampValue(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

export function formatScanDate(value: unknown): string {
  const time = timestampValue(value);
  return time ? new Date(time).toLocaleString() : 'Recent';
}