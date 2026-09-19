import { createWorker, PSM } from 'tesseract.js';

type OCRProgressCallback = (progress: number, status: string) => void;
type OCRSource = File | Blob | string;
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
};

function cleanOCRText(rawText: string) {
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

function scoreOCRCandidate(text: string, confidence: number | null) {
  const words = text.match(/[A-Za-z]{2,}/g) ?? [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  const duplicateCount = lines.length - new Set(lines.map(line => line.toLowerCase())).size;
  const productTerms = (text.match(/\b(?:spf|sunscreen|cream|cheese|serum|batch|exp|mfg|mfd|net|oz|ml|g|kraft|original|vitamin|niacinamide|broad|spectrum)\b/gi) ?? []).length;
  const numberTerms = (text.match(/\b\d+(?:[.,/]\d+)?\s*(?:g|kg|oz|ml|l|%|20\d{2})?\b/gi) ?? []).length;
  const garbageCharacters = (text.match(/[^A-Za-z0-9\s.,:+\-/()]/g) ?? []).length;
  const garbageRatio = text.length ? garbageCharacters / text.length : 1;
  return (confidence ?? 0) * 45
    + Math.min(words.length, 30) * 1.5
    + Math.min(lines.length, 15)
    + productTerms * 5
    + numberTerms * 3
    - duplicateCount * 8
    - garbageRatio * 35;
}

async function createPreprocessedImage(source: OCRSource): Promise<HTMLCanvasElement> {
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

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * OCR_SCALE;
    canvas.height = image.naturalHeight * OCR_SCALE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('OCR preprocessing canvas is unavailable.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

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

export async function performOCR(
  image: OCRSource,
  onProgress?: OCRProgressCallback
): Promise<{
  text: string;
  confidence: number | null;
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
    const preprocessingStart = performance.now();
    const preprocessedImage = await createPreprocessedImage(image);
    const preprocessingTimeMs = performance.now() - preprocessingStart;
    const strategies = [
      { name: 'auto', mode: PSM.AUTO },
      { name: 'sparse-text', mode: PSM.SPARSE_TEXT }
    ];
    const candidates: OCRCandidate[] = [];
    let recognitionTimeMs = 0;

    for (const strategy of strategies) {
      await worker.setParameters({ tessedit_pageseg_mode: strategy.mode });
      logOCR(`[OCR] recognition started (${strategy.name})`);
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
        candidates.push({
          text: strategyText,
          confidence: strategyConfidence,
          score: scoreOCRCandidate(strategyText, strategyConfidence),
          strategy: strategy.name
        });
      }
      logOCR(`[OCR] recognition completed (${strategy.name})`, {
        textLength: strategyText.length,
        confidence: strategyConfidence,
        score: candidates.at(-1)?.score ?? 0
      });

      const candidate = candidates.at(-1);
      const hasUsefulSignal = candidate && /\b(?:spf|net|oz|ml|g|cream|sunscreen|kraft|batch|exp|mfg)\b/i.test(candidate.text);
      if (strategy.name === 'auto' && candidate && candidate.score >= 70 && hasUsefulSignal) break;
    }

    const selectedCandidate = candidates.sort((left, right) => right.score - left.score)[0];
    const text = selectedCandidate?.text ?? '';
    const confidence = selectedCandidate?.confidence ?? null;

    logOCR('[OCR] recognition completed', {
      textLength: text.length,
      confidence,
      selectedStrategy: selectedCandidate?.strategy ?? null,
      candidateScores: candidates.map(candidate => ({ strategy: candidate.strategy, score: candidate.score }))
    });
    logOCR(`[OCR] raw text length: ${text.length}`);
    logOCR(`[OCR] confidence: ${confidence ?? 'unknown'}`);

    return { text, confidence, initializationTimeMs, preprocessingTimeMs, recognitionTimeMs };
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
