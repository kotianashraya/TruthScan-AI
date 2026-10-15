import fs from 'node:fs';
import path from 'node:path';

// Load real valid PNG image
const imagePath = path.resolve('frontend/node_modules/tesseract.js/docs/images/tesseract.png');
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString('base64');

const payload = {
  imageBase64,
  mimeType: 'image/png',
  context: {
    productName: 'Tesseract OCR Documentation Sample',
    brand: 'Tesseract Labs',
    extractedText: 'Tesseract OCR Sample Text Verification'
  }
};

console.log(`Loaded test image from ${imagePath} (${imageBuffer.length} bytes)`);
console.log('Sending POST to https://truthscan-ai-vision.mountain-hospital.workers.dev ...');

try {
  const startTime = Date.now();
  const res = await fetch('https://truthscan-ai-vision.mountain-hospital.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const durationMs = Date.now() - startTime;
  console.log(`HTTP Status: ${res.status} (${durationMs}ms)`);
  const json = await res.json();
  console.log('Response Body:\n', JSON.stringify(json, null, 2));
} catch (err) {
  console.error('Worker test failed:', err);
}
