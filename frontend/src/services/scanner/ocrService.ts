import { createWorker, PSM } from 'tesseract.js';

type OCRProgressCallback = (progress: number, status: string) => void;
type OCRSource = File | Blob | string;
const OCR_TIMEOUT_MS = 120_000;

let workerSingleton: Awaited<ReturnType<typeof createWorker>> | null = null;
let workerInitialization: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

function logOCR(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.debug(message);
  } else {
    console.debug(message, payload);
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
    logOCR('[OCR] recognition started');
    const recognitionStart = performance.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const recognition = worker.recognize(image);
    const { data: res } = await Promise.race([
      recognition,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('OCR recognition timed out.')), OCR_TIMEOUT_MS);
      })
    ]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    const recognitionTimeMs = performance.now() - recognitionStart;
    const text = (res?.text ?? '').trim();
    const confidence = typeof res?.confidence === 'number' ? Number((res.confidence / 100).toFixed(2)) : null;

    logOCR('[OCR] recognition completed', {
      textLength: text.length,
      confidence
    });
    logOCR(`[OCR] raw text length: ${text.length}`);
    logOCR(`[OCR] confidence: ${confidence ?? 'unknown'}`);

    return { text, confidence, initializationTimeMs, recognitionTimeMs };
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
