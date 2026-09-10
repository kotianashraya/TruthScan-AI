import { ProductInfo } from '@/types/ProductDetectionResult';

function findLineContaining(text: string, pattern: RegExp) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  for (const line of lines) {
    if (pattern.test(line)) return line;
  }
  return null;
}

export function parseProductInfo(rawText: string): ProductInfo {
  const text = rawText || '';
  const info: ProductInfo = {};

  // Brand: first non-empty line with letters
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    info.brand = lines[0] || null;
  }

  // Try product name as second line
  if (lines.length > 1) info.productName = lines[1] || null;

  // Batch/Lot
  const batch = findLineContaining(text, /batch|batch\s*no|lot/i);
  if (batch) {
    const m = batch.match(/([A-Za-z0-9\-\/]+)$/i);
    info.batchNumber = m ? m[1] : batch;
  }

  // Expiry date
  const exp = findLineContaining(text, /(exp|expiry|best before|best before date)/i);
  if (exp) {
    const m = exp.match(/(\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2})/);
    info.expiryDate = m ? m[0] : exp;
  }

  // MRP / Price
  const mrpLine = findLineContaining(text, /mrp|price|₹|rs\.?/i);
  if (mrpLine) {
    const m = mrpLine.match(/(\d+[\d,\.]+)/);
    info.mrp = m ? m[0] : mrpLine;
  }

  // Ingredients (simple heuristic: line containing 'ingredients')
  const ingredientsLine = findLineContaining(text, /ingredients/i);
  if (ingredientsLine) {
    const parts = ingredientsLine.split(':');
    info.ingredients = parts[1] ? parts[1].split(',').map(s => s.trim()) : [ingredientsLine];
  }

  return info;
}
