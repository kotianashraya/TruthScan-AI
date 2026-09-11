import { ProductInfo } from '@/types/ProductDetectionResult';

function findLineContaining(text: string, pattern: RegExp) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  for (const line of lines) {
    if (pattern.test(line)) return line;
  }
  return null;
}

export function parseProductInfo(rawText: string): ProductInfo {
  const text = rawText.trim();
  const info: ProductInfo = {};

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const labelledLine = (pattern: RegExp) => lines.find(line => pattern.test(line)) ?? null;

  const brandLine = labelledLine(/^brand\s*[:\-]/i);
  if (brandLine) info.brand = brandLine.replace(/^brand\s*[:\-]\s*/i, '').trim() || null;

  const productLine = labelledLine(/^(product|product\s*name)\s*[:\-]/i);
  if (productLine) info.productName = productLine.replace(/^(product|product\s*name)\s*[:\-]\s*/i, '').trim() || null;

  // Batch/Lot
  const batch = findLineContaining(text, /\b(?:batch|lot)\s*(?:no\.?|number)?\b/i);
  if (batch) {
    const m = batch.match(/(?:batch|lot)\s*(?:no\.?|number)?\s*[:#\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/]*)/i);
    info.batchNumber = m?.[1] ?? null;
  }

  // Expiry date
  const exp = findLineContaining(text, /\b(?:exp(?:iry)?|expires|best before)\b/i);
  if (exp) {
    const m = exp.match(/(\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2})/);
    info.expiryDate = m ? m[0] : exp;
  }

  const mfg = findLineContaining(text, /\b(?:mfg|mfd|manufactured)\b/i);
  if (mfg) {
    const m = mfg.match(/(\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2})/);
    info.manufacturingDate = m?.[0] ?? null;
  }

  // MRP / Price
  const mrpLine = findLineContaining(text, /\b(?:mrp|price|inr|rs\.?)\b|₹/i);
  if (mrpLine) {
    const m = mrpLine.match(/(\d+[\d,\.]+)/);
    info.mrp = m ? m[0] : mrpLine;
  }

  const quantityLine = findLineContaining(text, /\b(?:net\s*(?:wt|weight)|weight|volume)\b/i);
  if (quantityLine) {
    const m = quantityLine.match(/(\d+(?:[.,]\d+)?\s*(?:kg|g|mg|ml|l|oz|lb))\b/i);
    if (m) {
      if (/ml|l/i.test(m[1])) info.volume = m[1];
      else info.netWeight = m[1];
    }
  }

  // Ingredients (simple heuristic: line containing 'ingredients')
  const ingredientsLine = findLineContaining(text, /ingredients/i);
  if (ingredientsLine) {
    const parts = ingredientsLine.split(/:(.+)/);
    if (parts[1]) info.ingredients = parts[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  return info;
}
