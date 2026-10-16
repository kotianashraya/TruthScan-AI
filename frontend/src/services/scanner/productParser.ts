import { ProductInfo } from '@/types/ProductDetectionResult';

export const KNOWN_BRANDS = [
  'Nykaa', 'Himalaya', 'Minimalist', 'The Ordinary', 'CeraVe', 'Cetaphil', 'Neutrogena', 'La Roche-Posay',
  'Plum', 'Mamaearth', 'Dot & Key', 'Deconstruct', 'Sunscoop', 'Aqualogica',
  'Cosrx', 'Laneige', 'Clinique', 'Nivea', 'Dove', 'Kraft', 'L\'Oreal', 'Maybelline', 'Lakme',
  'Biotique', 'Forest Essentials', 'Derma Co', 'Vaseline'
];

export const PRODUCT_KEYWORDS = [
  'leave-in conditioner', 'leave in conditioner', 'face wash', 'moisturizer', 'sunscreen', 'sun screen',
  'serum', 'shampoo', 'conditioner', 'cleanser', 'toner', 'face mask', 'body lotion', 'lip balm',
  'cream cheese', 'face cream', 'cream', 'lotion', 'oil', 'scrub', 'gel'
].sort((a, b) => b.length - a.length);

const INGREDIENTS_MAP: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\b(argan\s*oil|argan)\b/i, name: 'Argan Oil' },
  { pattern: /\b(mango\s*butter)\b/i, name: 'Mango Butter' },
  { pattern: /\b(ginseng\s*root\s*extract|ginseng\s*root|ginseng)\b/i, name: 'Ginseng Root Extract' },
  { pattern: /\b(wheatgerm\s*oil|wheatgerm)\b/i, name: 'Wheatgerm Oil' },
  { pattern: /\b(carrot\s*seed\s*oil|carrot\s*seed)\b/i, name: 'Carrot Seed Oil' },
  { pattern: /\b(aloe\s*vera)\b/i, name: 'Aloe Vera' },
  { pattern: /\b(salicylic\s*acid)\b/i, name: 'Salicylic Acid' },
  { pattern: /\b(hyaluronic\s*acid)\b/i, name: 'Hyaluronic Acid' },
  { pattern: /\b(glycolic\s*acid)\b/i, name: 'Glycolic Acid' },
  { pattern: /\b(niacinamide)\b/i, name: 'Niacinamide' },
  { pattern: /\b(vitamin\s*b5)\b/i, name: 'Vitamin B5' },
  { pattern: /\b(vitamin\s*b3)\b/i, name: 'Vitamin B3' },
  { pattern: /\b(vitamin\s*c)\b/i, name: 'Vitamin C' },
  { pattern: /\b(vitamin\s*f)\b/i, name: 'Vitamin F' },
  { pattern: /\b(retinol)\b/i, name: 'Retinol' },
  { pattern: /\b(ceramides?)\b/i, name: 'Ceramides' },
  { pattern: /\b(squalane)\b/i, name: 'Squalane' },
  { pattern: /\b(azelaic\s*acid)\b/i, name: 'Azelaic Acid' },
  { pattern: /\b(kojic\s*acid)\b/i, name: 'Kojic Acid' },
  { pattern: /\b(alpha\s*arbutin)\b/i, name: 'Alpha Arbutin' },
  { pattern: /\b(peptides)\b/i, name: 'Peptides' },
  { pattern: /\b(zinc\s*oxide)\b/i, name: 'Zinc Oxide' }
];

const FEATURE_PATTERNS: Array<[RegExp, string]> = [
  [/\bpa\s*\+{1,4}(?!\+)/i, 'PA++++'],
  [/\bbroad\s+spectrum\b/i, 'Broad Spectrum'],
  [/\bfor\s+all\s+skin\s+types?\b/i, 'For All Skin Types'],
  [/\bfragrance[-\s]?free\b/i, 'Fragrance Free'],
  [/\bdermatologically\s+tested\b/i, 'Dermatologically Tested'],
  [/\bnon[-\s]?comedogenic\b/i, 'Non-Comedogenic'],
  [/\bfrizz\s+control\b/i, 'Frizz Control'],
  [/\bweightless\b/i, 'Weightless']
];

function linesOf(text: string): string[] {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function findLineContaining(lines: string[], pattern: RegExp): string | null {
  return lines.find(line => pattern.test(line)) ?? null;
}

export function normalizeUnit(numStr: string, unitRaw: string): string {
  const num = numStr.replace(',', '.').trim();
  const unit = unitRaw.toLowerCase()
    .replace(/^kgs?$/, 'kg')
    .replace(/^(?:gms?|grams?)$/, 'g')
    .replace(/^(?:millilit(?:er|re)s?|mls?)$/, 'ml')
    .replace(/^(?:lit(?:er|re)s?|ltrs?)$/, 'L')
    .replace(/^fl\.?\s*oz$/, 'fl oz');

  if (unit === 'l') return `${num} L`;
  return `${num} ${unit}`;
}

export function findMeasurement(text: string): string | null {
  if (!text || !text.trim()) return null;

  // 1. High-confidence contextual anchors:
  // Net Wt, Net Weight, Net Vol, Net Volume, Contents, Quantity, Qty
  const ANCHOR_REGEX = /(?:net\s*(?:wt\.?|weight|vol\.?|volume)|contents?|quantity|qty\.?)\s*[:.-]?\s*(\d+(?:[.,]\d+)?)\s*(kg|kgs|g|gm|gms|grams?|mg|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|ltrs?|oz|fl\.?\s*oz|lb)\b/i;
  const anchorMatch = text.match(ANCHOR_REGEX);
  if (anchorMatch) {
    const val = parseFloat(anchorMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0 && val <= 50000) {
      return normalizeUnit(anchorMatch[1], anchorMatch[2]);
    }
  }

  // 2. Unanchored measurement pattern
  const MEASUREMENT_REGEX = /\b(\d+(?:[.,]\d+)?)\s*(kg|kgs|g|gm|gms|grams?|mg|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|ltrs?|oz|fl\.?\s*oz|lb)\b/gi;
  const matches = Array.from(text.matchAll(MEASUREMENT_REGEX));

  for (const match of matches) {
    const fullMatch = match[0];
    const numStr = match[1];
    const unitRaw = match[2];
    const numVal = parseFloat(numStr.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) continue;

    // Check preceding text up to 35 chars
    const matchIndex = match.index ?? 0;
    const prefix = text.substring(Math.max(0, matchIndex - 35), matchIndex).toLowerCase();

    // Check for negative context anchors:
    // batch, lot, exp, expiry, mfg, mfd, since, est, year, ©, copyright, code, pin, box, no.
    if (/(?:batch|lot|exp(?:iry)?|mfg|mfd|manufactured|since|est\.?|established|year|©|copyright|pincode|pin|code|no\.?|rs\.?|inr|₹)\s*[:#-]?\s*$/i.test(prefix)) {
      continue;
    }

    // Exclude 4-digit years (e.g., 1900 to 2099)
    if (numVal >= 1900 && numVal <= 2099 && Number.isInteger(numVal)) {
      continue;
    }

    const unitLower = unitRaw.toLowerCase();

    // Specific protection for single-letter "g":
    // An unanchored "g" is only accepted if:
    // a) It is tightly bound without space (e.g. "10g", "50g", "100g") AND numVal <= 2000
    // b) Or the unit is explicitly "gm", "gms", "gram", "grams"
    // An unanchored number with whitespace before a lone "g" (e.g. "2023 g", "1930 g") is rejected as OCR noise.
    if (unitLower === 'g') {
      const hasNoSpace = !/\s/.test(fullMatch);
      if (!hasNoSpace) {
        continue;
      }
      if (numVal > 2000) continue;
    }

    // Realistic bounds check for consumer cosmetics / personal care
    if (unitLower === 'l' && numVal > 25) continue;
    if (unitLower === 'ml' && numVal > 5000) continue;
    if (unitLower.startsWith('kg') && numVal > 50) continue;

    return normalizeUnit(numStr, unitRaw);
  }

  return null;
}

function findDate(line: string | null): string | null {
  if (!line) return null;
  return line.match(/\b(?:\d{1,2}[\s-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]?\d{2,4}|\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}\b/i)?.[0] ?? null;
}

function findPrice(text: string): string | null {
  const match = text.match(/(?:mrp|price|rs\.?|inr)\s*[:.]?\s*(?:₹\s*)?(\d[\d,.]*)|₹\s*(\d[\d,.]*)/i);
  const amount = match?.[1] ?? match?.[2];
  return amount ? `₹${amount.replace(/,/g, '')}` : null;
}

function findBatch(lines: string[]): string | null {
  const line = findLineContaining(lines, /\b(?:batch|lot)\s*(?:no\.?|number)?\b/i);
  if (!line) return null;
  return line.match(/\b(?:batch|lot)\s*(?:no\.?|number)?\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9\/-]*)/i)?.[1] ?? null;
}

export function findKnownBrand(text: string): string | null {
  return KNOWN_BRANDS.find(brand => new RegExp(`(^|\\W)${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\W|$)`, 'i').test(text)) ?? null;
}

export function findProductName(lines: string[], brand: string | null): string | null {
  const labelled = lines.find(line => /^(?:product|product\s*name)\s*[:\-]/i.test(line));
  if (labelled) {
    const raw = labelled.replace(/^(?:product|product\s*name)\s*[:\-]\s*/i, '').trim();
    if (raw) return raw;
  }

  for (const keyword of PRODUCT_KEYWORDS) {
    const keywordPattern = new RegExp(`\\b${keyword.replace(/ /g, '\\s+')}\\b`, 'i');
    const index = lines.findIndex(item => keywordPattern.test(item));
    if (index >= 0) {
      let currentLine = lines[index].replace(/[^A-Za-z0-9\s+\-\/]/g, ' ').replace(/\s+/g, ' ').trim();

      // If the brand is at the start of current line, strip it
      if (brand) {
        const brandRegex = new RegExp(`^${brand}\\s*`, 'i');
        currentLine = currentLine.replace(brandRegex, '').trim();
      }

      // Strip trailing quantity / net weight information from the product name line
      currentLine = currentLine
        .replace(/\b(?:net\s*(?:wt\.?|weight|vol\.?|volume)|quantity|qty)\b.*$/i, '')
        .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|g|gm|gms|mg|ml|l|oz)\b.*$/i, '')
        .trim();

      // Check if previous line has descriptive prefix words (e.g. "Weightless", "Hydrating")
      const prevLine = lines[index - 1]?.replace(/[^A-Za-z0-9\s+\-\/]/g, ' ').trim() || '';
      const isPrevDescriptive = /\b(weightless|hydrating|gentle|original|classic|premium|natural|whipped|light|rich)\b/i.test(prevLine);

      if (isPrevDescriptive && !KNOWN_BRANDS.some(b => prevLine.toLowerCase().includes(b.toLowerCase()))) {
        currentLine = `${prevLine} ${currentLine}`.trim();
      }

      const words = currentLine.split(/\s+/).filter(Boolean);
      if (words.length >= 1 && words.length <= 6 && currentLine.length <= 45) {
        return currentLine
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
          .replace(/Leave In/i, 'Leave-in');
      }

      return keyword
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .replace('Sun Screen', 'Sunscreen')
        .replace(/Leave In/i, 'Leave-in');
    }
  }
  return null;
}

export function parseProductInfo(rawText: string): ProductInfo {
  const text = rawText.trim();
  const info: ProductInfo = {};

  const lines = linesOf(text);
  const brand = findKnownBrand(text);
  info.brand = brand;
  info.productName = findProductName(lines, brand);

  // Variant detection (e.g. "Argan + Frizz Control", "PA++++ Multi-Vitamin")
  const variantLine = lines.find(l => /\b(argan\s*\+\s*frizz\s*control|wheatgerm|carrot\s*seed|aloe\s*vera)\b/i.test(l));
  if (variantLine) {
    info.variant = variantLine.trim();
  }

  const measurement = findMeasurement(text);
  if (measurement) {
    info.quantity = measurement;
    if (/ml|l|oz|fl/i.test(measurement)) {
      info.volume = measurement;
    } else {
      info.netWeight = measurement;
    }
  } else {
    info.quantity = null;
    info.netWeight = null;
    info.volume = null;
  }

  info.batchNumber = findBatch(lines);
  info.manufacturingDate = findDate(findLineContaining(lines, /\b(?:mfg|mfd|manufactured)\b/i));
  info.expiryDate = findDate(findLineContaining(lines, /\b(?:exp(?:iry)?|expires|use before|best before)\b/i));
  if (!info.manufacturingDate && !info.expiryDate) {
    const neutralDate = lines.find(line => /\b(?:\d{1,2}[\s-])?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]?\d{2,4}\b/i.test(line));
    info.detectedDate = findDate(neutralDate);
  }
  info.mrp = findPrice(text);

  const detectedIngredients = INGREDIENTS_MAP
    .filter(item => item.pattern.test(text))
    .map(item => item.name);

  // Deduplicate ingredients
  if (detectedIngredients.length) {
    info.ingredients = Array.from(new Set(detectedIngredients));
  }

  const spf = text.match(/\bspf\s*(\d{1,3})(\s*\+)?\b/i);
  if (spf) info.spf = `SPF ${spf[1]}${spf[2] ? '+' : ''}`;

  const features = FEATURE_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  if (features.length) info.productFeatures = features;

  const score = (info.brand ? 15 : 0) + (info.productName ? 15 : 0) + (info.quantity ? 10 : 0)
    + (info.ingredients?.length ? 15 : 0) + (info.spf ? 10 : 0) + (info.batchNumber ? 10 : 0)
    + (info.expiryDate ? 10 : 0) + (info.mrp ? 5 : 0) + (info.productFeatures?.length ? 10 : 0);
  info.parserConfidence = score;

  return info;
}
