import { ProductInfo } from '@/types/ProductDetectionResult';

const KNOWN_BRANDS = [
  'Minimalist', 'The Ordinary', 'CeraVe', 'Cetaphil', 'Neutrogena', 'La Roche-Posay',
  'Plum', 'Mamaearth', 'Dot & Key', 'Deconstruct', 'Sunscoop', 'Aqualogica',
  'Cosrx', 'Laneige', 'Clinique', 'Nivea', 'Dove', 'Kraft', 'L\'Oreal', 'Maybelline', 'Lakme'
];

const PRODUCT_KEYWORDS = [
  'face wash', 'moisturizer', 'sunscreen', 'sun screen', 'serum', 'shampoo',
  'conditioner', 'cleanser', 'toner', 'face mask', 'body lotion', 'lip balm',
  'cream cheese', 'face cream', 'cream', 'lotion', 'oil', 'scrub'
].sort((a, b) => b.length - a.length);

const INGREDIENTS = [
  'salicylic acid', 'hyaluronic acid', 'glycolic acid', 'niacinamide', 'vitamin b5',
  'vitamin b3', 'vitamin c', 'vitamin f', 'retinol', 'ceramide', 'squalane',
  'azelaic acid', 'kojic acid', 'alpha arbutin', 'peptides', 'zinc oxide'
];

const FEATURE_PATTERNS: Array<[RegExp, string]> = [
  [/\bpa\s*\+{1,4}(?!\+)/i, 'PA++++'],
  [/\bbroad\s+spectrum\b/i, 'Broad Spectrum'],
  [/\bfor\s+all\s+skin\s+types?\b/i, 'For All Skin Types'],
  [/\bfragrance[-\s]?free\b/i, 'Fragrance Free'],
  [/\bdermatologically\s+tested\b/i, 'Dermatologically Tested'],
  [/\bnon[-\s]?comedogenic\b/i, 'Non-Comedogenic']
];

function linesOf(text: string) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function findLineContaining(lines: string[], pattern: RegExp) {
  return lines.find(line => pattern.test(line)) ?? null;
}

function normalizeUnit(value: string) {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*(kg|kgs|g|gm|gms|mg|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|oz|lb)/i);
  if (!match) return value.trim();
  const unit = match[2].toLowerCase().replace(/kgs?/, 'kg').replace(/gms?/, 'g').replace(/millilit(?:er|re)s?/, 'ml').replace(/lit(?:er|re)s?/, 'l');
  return `${match[1]} ${unit}`;
}

function findMeasurement(text: string) {
  const matches = Array.from(text.matchAll(/\b(\d+(?:[.,]\d+)?\s*(?:kg|kgs|g|gm|gms|mg|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|oz|lb))\b/gi));
  if (!matches.length) return null;
  const normalized = matches.map(match => normalizeUnit(match[1]));
  return normalized.length > 1 ? `${normalized[0]} (${normalized[1]})` : normalized[0];
}

function findDate(line: string | null) {
  if (!line) return null;
  return line.match(/\b(?:\d{1,2}[\s-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]?\d{2,4}|\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}\b/i)?.[0] ?? null;
}

function findPrice(text: string) {
  const match = text.match(/(?:mrp|price|rs\.?|inr)\s*[:.]?\s*(?:₹\s*)?(\d[\d,.]*)|₹\s*(\d[\d,.]*)/i);
  const amount = match?.[1] ?? match?.[2];
  return amount ? `₹${amount.replace(/,/g, '')}` : null;
}

function findBatch(lines: string[]) {
  const line = findLineContaining(lines, /\b(?:batch|lot)\s*(?:no\.?|number)?\b/i);
  if (!line) return null;
  return line.match(/\b(?:batch|lot)\s*(?:no\.?|number)?\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9\/-]*)/i)?.[1] ?? null;
}

function findKnownBrand(text: string) {
  return KNOWN_BRANDS.find(brand => new RegExp(`(^|\\W)${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\W|$)`, 'i').test(text)) ?? null;
}

function findProductName(lines: string[]) {
  const labelled = lines.find(line => /^(?:product|product\s*name)\s*[:\-]/i.test(line));
  if (labelled) return labelled.replace(/^(?:product|product\s*name)\s*[:\-]\s*/i, '').trim() || null;
  for (const keyword of PRODUCT_KEYWORDS) {
    const keywordPattern = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'i');
    const index = lines.findIndex(item => keywordPattern.test(item));
    if (index >= 0) {
      const current = lines[index].replace(/[^A-Za-z\s]/g, ' ').trim();
      const previous = lines[index - 1]?.replace(/[^A-Za-z\s]/g, ' ').trim();
      const next = lines[index + 1]?.replace(/[^A-Za-z\s]/g, ' ').trim();
      const adjacent = [previous, current, next].filter(Boolean).filter(line => !KNOWN_BRANDS.some(brand => line.toLowerCase() === brand.toLowerCase()));
      const productWords = adjacent.filter(line => /\b(original|classic|premium|natural|whipped|light|rich)\b/i.test(line));
      if (productWords.length) {
        return `${productWords[0]} ${current}`
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, char => char.toUpperCase());
      }
      return keyword.replace(/\b\w/g, char => char.toUpperCase()).replace('Sun Screen', 'Sunscreen');
    }
  }
  return null;
}

export function parseProductInfo(rawText: string): ProductInfo {
  const text = rawText.trim();
  const info: ProductInfo = {};

  const lines = linesOf(text);
  info.brand = findKnownBrand(text);
  info.productName = findProductName(lines);

  const measurement = findMeasurement(text);
  if (measurement) {
    if (/ml|l|oz|lb/i.test(measurement)) info.volume = measurement;
    else info.netWeight = measurement;
  }

  info.batchNumber = findBatch(lines);
  info.manufacturingDate = findDate(findLineContaining(lines, /\b(?:mfg|mfd|manufactured)\b/i));
  info.expiryDate = findDate(findLineContaining(lines, /\b(?:exp(?:iry)?|expires|use before|best before)\b/i));
  if (!info.manufacturingDate && !info.expiryDate) {
    const neutralDate = lines.find(line => /\b(?:\d{1,2}[\s-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]?\d{2,4}\b/i.test(line));
    info.detectedDate = findDate(neutralDate);
  }
  info.mrp = findPrice(text);

  const detectedIngredients = INGREDIENTS
    .filter(ingredient => new RegExp(`\\b${ingredient.replace(' ', '\\s+')}\\b`, 'i').test(text))
    .map(ingredient => ingredient.replace(/\b\w/g, char => char.toUpperCase()));
  if (detectedIngredients.length) info.ingredients = detectedIngredients;

  const spf = text.match(/\bspf\s*(\d{1,3})(\s*\+)?\b/i);
  if (spf) info.spf = `SPF ${spf[1]}${spf[2] ? '+' : ''}`;

  const features = FEATURE_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  if (features.length) info.productFeatures = features;

  const score = (info.brand ? 15 : 0) + (info.productName ? 15 : 0) + (info.netWeight || info.volume ? 10 : 0)
    + (info.ingredients?.length ? 15 : 0) + (info.spf ? 10 : 0) + (info.batchNumber ? 10 : 0)
    + (info.expiryDate ? 10 : 0) + (info.mrp ? 5 : 0) + (info.productFeatures?.length ? 10 : 0);
  info.parserConfidence = score;

  return info;
}
