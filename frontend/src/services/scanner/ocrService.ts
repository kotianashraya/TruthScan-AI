import { createWorker, PSM } from 'tesseract.js';

type OCRProgressCallback = (progress: number, status: string) => void;

let workerSingleton: Awaited<ReturnType<typeof createWorker>> | null = null;

export async function performOCR(
  image: File | Blob | string,
  onProgress?: OCRProgressCallback
): Promise<{ text: string; confidence: number | null }> {
  const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

  const debugLog = (message: string, payload?: unknown) => {
    if (isDevelopment) {
      if (payload !== undefined) {
        console.debug(message, payload);
      } else {
        console.debug(message);
      }
    }
  };

  try {
    if (!workerSingleton) {
      debugLog('[OCR] OCR worker initializing');
      workerSingleton = await createWorker({
        logger: (message) => {
          const status = message?.status ?? 'processing';
          const progress = typeof message?.progress === 'number' ? message.progress : 0;

          debugLog('[OCR] Worker status', { status, progress });
          onProgress?.(progress, status);
        }
      });

      debugLog('[OCR] OCR language loading');
      await workerSingleton.loadLanguage('eng');
      await workerSingleton.initialize('eng');
      await workerSingleton.setParameters({
        tessedit_pageseg_mode: PSM.AUTO
      });
      debugLog('[OCR] OCR worker ready');
    }

    const source = image;
    debugLog('[OCR] Recognition started');
    const { data: res } = await workerSingleton.recognize(source);
    const text = (res?.text ?? '').trim();
    const confidence = typeof res?.confidence === 'number' ? Number((res.confidence / 100).toFixed(2)) : null;

    debugLog('[OCR] Recognition completed', {
      textLength: text.length,
      confidence
    });
    debugLog('[OCR] OCR text length', text.length);
    debugLog('[OCR] OCR confidence', confidence);

    return { text, confidence };
  } catch (error) {
    console.error('[OCR] OCR error', error);
    throw error;
  }
}

export async function terminateOCR() {
  try {
    if (workerSingleton) {
      await workerSingleton.terminate();
      workerSingleton = null;
    }
  } catch (error) {
    console.warn('[OCR] Error terminating OCR worker', error);
  }
}
