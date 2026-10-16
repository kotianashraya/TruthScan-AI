import { createWorker, PSM } from 'tesseract.js';

type OCRProgressCallback = (progress: number, status: string) => void;
type OCRSource = File | Blob | string;
export type OCRRotation = 0 | 90 | 180 | 270;

const OCR_TIMEOUT_MS = 120_000;
const OCR_SCALE = 2;

let workerSingleton: Awaited<ReturnType<typeof createWorker>> | null = null;
let workerInitialization: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

function logOCR(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.debug(message);
  } else {
    console.debug(message, payload);
  }
}

type OCRCandidate = {
  text: string;
  confidence: number | null;
  score: number;
  strategy: string;
  rotation: OCRRotation;
};

function cleanOCRText(rawText: string): string {
  const seen = new Set<string>();
  return rawText
    .split(/\r?\n/)
    .map(line => line.replace(/[|{}<>]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(line => {
      const key = line.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (!key || seen.has(key)) return false;
      const alphanumeric = (line.match(/[a-z0-9]/gi) ?? []).length;
      const digits = (line.match(/\d/g) ?? []).length;
      const letters = (line.match(/[a-z]/gi) ?? []).length;
      const symbols = (line.match(/[^\w\s]/g) ?? []).length;
      if (letters === 0 && digits >= 7) return false;
      if (alphanumeric < 2 || symbols > alphanumeric * 1.5) return false;
      seen.add(key);
      return true;
    })
    .join('\n');
}

export function scoreOCRCandidate(text: string, confidence: number | null): number {
  const words = text.match(/[A-Za-z]{2,}/g) ?? [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  const duplicateCount = lines.length - new Set(lines.map(line => line.toLowerCase())).size;
  const productTerms = (text.match(/\b(?:spf|sunscreen|cream|cheese|serum|batch|exp|mfg|mfd|net|oz|ml|g|kraft|original|vitamin|niacinamide|broad|spectrum|nykaa|himalaya|conditioner|argan|frizz|mango|ginseng|vol|volume|weight|wt)\b/gi) ?? []).length;
  const numberTerms = (text.match(/\b\d+(?:[.,/]\d+)?\s*(?:g|kg|oz|ml|l|%|20\d{2})?\b/gi) ?? []).length;
  const garbageCharacters = (text.match(/[^A-Za-z0-9\s.,:+\-/()]/g) ?? []).length;
  const garbageRatio = text.length ? garbageCharacters / text.length : 1;
  return (confidence ?? 0) * 45
    + Math.min(words.length, 30) * 1.5
    + Math.min(lines.length, 15)
    + productTerms * 6
    + numberTerms * 3
    - duplicateCount * 8
    - garbageRatio * 35;
}

async function createPreprocessedImage(source: OCRSource, rotationDeg: OCRRotation = 0): Promise<HTMLCanvasElement> {
  const image = new Image();
  let objectUrl: string | null = null;

  if (typeof source === 'string') {
    image.src = source;
  } else {
    objectUrl = URL.createObjectURL(source);
    image.src = objectUrl;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image could not be loaded for OCR preprocessing.'));
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Image has no readable dimensions.');
    }

    const is90or270 = rotationDeg === 90 || rotationDeg === 270;
    const baseW = is90or270 ? image.naturalHeight : image.naturalWidth;
    const baseH = is90or270 ? image.naturalWidth : image.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = baseW * OCR_SCALE;
    canvas.height = baseH * OCR_SCALE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('OCR preprocessing canvas is unavailable.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.save();
    if (rotationDeg === 180) {
      context.translate(canvas.width, canvas.height);
      context.rotate(Math.PI);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else if (rotationDeg === 90) {
      context.translate(canvas.width, 0);
      context.rotate(Math.PI / 2);
      context.drawImage(image, 0, 0, canvas.height, canvas.width);
    } else if (rotationDeg === 270) {
      context.translate(0, canvas.height);
      context.rotate(-Math.PI / 2);
      context.drawImage(image, 0, 0, canvas.height, canvas.width);
    } else {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    context.restore();

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;
    for (let index = 0; index < data.length; index += 4) {
      const luminance = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
      const contrast = Math.max(0, Math.min(255, ((luminance - 128) * 1.25) + 128));
      data[index] = contrast;
      data[index + 1] = contrast;
      data[index + 2] = contrast;
    }
    context.putImageData(pixels, 0, 0);
    return canvas;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function getWorker(onProgress?: OCRProgressCallback) {
  if (workerSingleton) return workerSingleton;
  if (workerInitialization) return workerInitialization;

  logOCR('[OCR] worker initialization started');
  workerInitialization = (async () => {
    const worker = await createWorker({
      logger: (message) => {
        const status = message?.status ?? 'processing';
        const progress = typeof message?.progress === 'number' ? message.progress : 0;
        onProgress?.(progress, status);
      }
    });

    try {
      try {
        await worker.loadLanguage('eng');
      } catch (error) {
        throw new Error(`English language loading failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        await worker.initialize('eng');
      } catch (error) {
        throw new Error(`Tesseract worker initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      workerSingleton = worker;
      logOCR('[OCR] worker initialized');
      return worker;
    } catch (error) {
      await worker.terminate();
      throw error;
    } finally {
      workerInitialization = null;
    }
  })();

  return workerInitialization;
}

export interface PerformOCROptions {
  rotationHint?: OCRRotation;
  tryRotationsIfLowScore?: boolean;
}

export async function performOCR(
  image: OCRSource,
  onProgress?: OCRProgressCallback,
  options?: PerformOCROptions
): Promise<{
  text: string;
  confidence: number | null;
  rotationUsed: OCRRotation;
  initializationTimeMs: number;
  preprocessingTimeMs: number;
  recognitionTimeMs: number;
}> {
  let activeWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    if (!image || (typeof image !== 'string' && image.size === 0)) {
      throw new Error('Invalid image input');
    }

    const initializationStart = performance.now();
    const worker = await getWorker(onProgress);
    activeWorker = worker;
    const initializationTimeMs = performance.now() - initializationStart;

    const initialRotation: OCRRotation = options?.rotationHint ?? 0;
    const rotationsToTry: OCRRotation[] = [initialRotation];

    // If initial rotation is not 180, 180 is the primary candidate for upside-down packaging
    if (initialRotation !== 180) rotationsToTry.push(180);
    else rotationsToTry.push(0);

    const candidates: OCRCandidate[] = [];
    let preprocessingTimeMs = 0;
    let recognitionTimeMs = 0;

    for (const rotation of rotationsToTry) {
      const pStart = performance.now();
      const preprocessedImage = await createPreprocessedImage(image, rotation);
      preprocessingTimeMs += performance.now() - pStart;

      const strategies = [
        { name: 'auto', mode: PSM.AUTO },
        { name: 'sparse-text', mode: PSM.SPARSE_TEXT }
      ];

      for (const strategy of strategies) {
        await worker.setParameters({ tessedit_pageseg_mode: strategy.mode });
        const recognitionStart = performance.now();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const recognition = worker.recognize(preprocessedImage);
        const { data: res } = await Promise.race([
          recognition,
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('OCR recognition timed out.')), OCR_TIMEOUT_MS);
          })
        ]).finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });

        recognitionTimeMs += performance.now() - recognitionStart;
        const rawStrategyText = (res?.text ?? '').trim();
        const strategyText = cleanOCRText(rawStrategyText);
        const strategyConfidence = typeof res?.confidence === 'number' ? Number((res.confidence / 100).toFixed(2)) : null;

        if (strategyText) {
          const score = scoreOCRCandidate(strategyText, strategyConfidence);
          candidates.push({
            text: strategyText,
            confidence: strategyConfidence,
            score,
            strategy: strategy.name,
            rotation
          });
        }

        const latest = candidates.at(-1);
        const hasUsefulSignal = latest && /\b(?:spf|net|oz|ml|g|cream|sunscreen|kraft|batch|exp|mfg|nykaa|himalaya|conditioner)\b/i.test(latest.text);

        // If auto mode at this rotation scored very well and has useful signal, no need to test further strategies or rotations
        if (strategy.name === 'auto' && latest && latest.score >= 70 && hasUsefulSignal) {
          break;
        }
      }

      // If the current rotation produced a very strong candidate (score >= 75), stop trying further rotations
      const currentBest = candidates.filter(c => c.rotation === rotation).sort((a, b) => b.score - a.score)[0];
      if (currentBest && currentBest.score >= 75) {
        break;
      }
    }

    const selectedCandidate = candidates.sort((left, right) => right.score - left.score)[0];
    const text = selectedCandidate?.text ?? '';
    const confidence = selectedCandidate?.confidence ?? null;
    const rotationUsed = selectedCandidate?.rotation ?? initialRotation;

    logOCR('[OCR] recognition completed', {
      textLength: text.length,
      confidence,
      rotationUsed,
      selectedStrategy: selectedCandidate?.strategy ?? null,
      candidates: candidates.map(c => ({ rot: c.rotation, strat: c.strategy, score: c.score }))
    });

    return {
      text,
      confidence,
      rotationUsed,
      initializationTimeMs,
      preprocessingTimeMs,
      recognitionTimeMs
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (activeWorker) await terminateOCR();
    console.error('[OCR] recognition failed', error);
    throw new Error(`OCR recognition failed: ${message}`);
  }
}

export async function terminateOCR() {
  try {
    if (workerSingleton) {
      await workerSingleton.terminate();
      workerSingleton = null;
    }
    workerInitialization = null;
  } catch (error) {
    console.warn('[OCR] Error terminating OCR worker', error);
  }
}
