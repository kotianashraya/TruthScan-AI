import type { ProductInfo, BarcodeResult } from '@/types/ProductDetectionResult';
import type { ProductVerificationResult, VerifiedProductRecord, VerificationStatus } from '@/types/ProductDatabase';

export const VERIFIED_PRODUCT_CATALOG: VerifiedProductRecord[] = [
  {
    id: 'min-spf-50',
    brand: 'Minimalist',
    productName: 'Sunscreen SPF 50',
    variant: 'PA++++ Multi-Vitamin',
    barcode: '8906128100155',
    category: 'Skincare',
    manufacturer: 'Uprising Science Pvt. Ltd.',
    typicalBatchPattern: /^[A-Z0-9]{6,10}$/i,
    priceRange: { min: 350, max: 450, currency: '₹' },
    keyIngredients: ['Niacinamide', 'Vitamin B5', 'Vitamin F', 'Zinc Oxide'],
    features: ['Broad Spectrum', 'PA++++', 'Fragrance Free', 'Non-Comedogenic']
  },
  {
    id: 'min-nia-10',
    brand: 'Minimalist',
    productName: 'Niacinamide 10%',
    variant: 'Serum with Zinc',
    barcode: '8906128100018',
    category: 'Skincare',
    manufacturer: 'Uprising Science Pvt. Ltd.',
    typicalBatchPattern: /^[A-Z0-9]{6,10}$/i,
    priceRange: { min: 550, max: 650, currency: '₹' },
    keyIngredients: ['Niacinamide', 'Zinc PCA', 'Hyaluronic Acid'],
    features: ['Fragrance Free', 'Dermatologically Tested']
  },
  {
    id: 'min-sal-02',
    brand: 'Minimalist',
    productName: 'Salicylic Acid 2%',
    variant: 'Serum',
    barcode: '8906128100032',
    category: 'Skincare',
    manufacturer: 'Uprising Science Pvt. Ltd.',
    priceRange: { min: 499, max: 599, currency: '₹' },
    keyIngredients: ['Salicylic Acid', 'Aloe Vera', 'Oligopeptide'],
    features: ['Fragrance Free', 'Non-Comedogenic']
  },
  {
    id: 'cer-hyd-cln',
    brand: 'CeraVe',
    productName: 'Hydrating Facial Cleanser',
    variant: 'For Normal to Dry Skin',
    barcode: '3337875597180',
    category: 'Skincare',
    manufacturer: 'L\'Oreal / CeraVe LLC',
    typicalBatchPattern: /^[0-9A-Z]{6,8}$/i,
    keyIngredients: ['Ceramides', 'Hyaluronic Acid'],
    features: ['Non-Comedogenic', 'Fragrance Free', 'Dermatologist Recommended']
  },
  {
    id: 'cer-moi-crm',
    brand: 'CeraVe',
    productName: 'Moisturizing Cream',
    variant: 'For Dry to Very Dry Skin',
    barcode: '3337875597227',
    category: 'Skincare',
    manufacturer: 'L\'Oreal / CeraVe LLC',
    typicalBatchPattern: /^[0-9A-Z]{6,8}$/i,
    keyIngredients: ['Ceramides', 'Hyaluronic Acid'],
    features: ['Non-Comedogenic', 'Fragrance Free']
  },
  {
    id: 'ord-nia-10',
    brand: 'The Ordinary',
    productName: 'Niacinamide 10% + Zinc 1%',
    variant: 'High-Strength Vitamin and Mineral Blemish Formula',
    barcode: '769915190312',
    category: 'Skincare',
    manufacturer: 'Deciem Inc.',
    typicalBatchPattern: /^[0-9A-Z]{4,7}$/i,
    keyIngredients: ['Niacinamide', 'Zinc PCA'],
    features: ['Fragrance Free', 'Cruelty Free', 'Alcohol Free']
  },
  {
    id: 'ord-hya-02',
    brand: 'The Ordinary',
    productName: 'Hyaluronic Acid 2% + B5',
    variant: 'Hydration Support Formula',
    barcode: '769915190206',
    category: 'Skincare',
    manufacturer: 'Deciem Inc.',
    typicalBatchPattern: /^[0-9A-Z]{4,7}$/i,
    keyIngredients: ['Hyaluronic Acid', 'Vitamin B5'],
    features: ['Fragrance Free', 'Vegan']
  },
  {
    id: 'krf-org-chz',
    brand: 'Kraft',
    productName: 'Original Cream Cheese',
    variant: 'Spread',
    barcode: '021000612239',
    category: 'Food & Dairy',
    manufacturer: 'Kraft Heinz Foods Company',
    typicalBatchPattern: /^[0-9A-Z]{6,12}$/i,
    keyIngredients: ['Pasteurized Milk', 'Cream', 'Cheese Culture', 'Salt'],
    features: ['Keep Refrigerated']
  },
  {
    id: 'cet-gen-cln',
    brand: 'Cetaphil',
    productName: 'Gentle Skin Cleanser',
    variant: 'Dry to Normal Sensitive Skin',
    barcode: '3499320013581',
    category: 'Skincare',
    manufacturer: 'Galderma Laboratories',
    typicalBatchPattern: /^[0-9A-Z]{6,8}$/i,
    keyIngredients: ['Niacinamide', 'Vitamin B5', 'Hydrating Glycerin'],
    features: ['Fragrance Free', 'Paraben Free', 'Dermatologist Tested']
  },
  {
    id: 'neu-hyd-bst',
    brand: 'Neutrogena',
    productName: 'Hydro Boost Water Gel',
    variant: 'Hyaluronic Acid Moisturizer',
    barcode: '070501110003',
    category: 'Skincare',
    manufacturer: 'Johnson & Johnson Consumer Inc.',
    typicalBatchPattern: /^[0-9A-Z]{6,10}$/i,
    keyIngredients: ['Hyaluronic Acid', 'Glycerin'],
    features: ['Oil-Free', 'Non-Comedogenic']
  }
];

export function verifyAgainstDatabase(
  productInfo: ProductInfo,
  barcode: BarcodeResult
): ProductVerificationResult {
  const brand = productInfo.brand?.trim() || null;
  const productName = productInfo.productName?.trim() || null;
  const barcodeValue = barcode.detected && barcode.value ? barcode.value.trim() : null;

  // If no identifiable information is available, cannot query database
  if (!brand && !productName && !barcodeValue) {
    return {
      status: 'UNKNOWN',
      statusLabel: 'Unable to Verify',
      details: 'No brand, product name, or barcode detected to match against the reference database.',
      brandMatched: false,
      productMatched: false,
      barcodeMatched: false,
      matchedRecord: null,
      notes: ['Product information was insufficient for catalog lookup.']
    };
  }

  // 1. Try barcode exact lookup first
  let barcodeMatch: VerifiedProductRecord | null = null;
  if (barcodeValue) {
    barcodeMatch = VERIFIED_PRODUCT_CATALOG.find(entry => entry.barcode === barcodeValue) || null;
  }

  // 2. Try brand + product name lookup
  let catalogCandidate: VerifiedProductRecord | null = barcodeMatch;

  if (!catalogCandidate && brand) {
    catalogCandidate = VERIFIED_PRODUCT_CATALOG.find(entry => {
      const brandMatches = entry.brand.toLowerCase() === brand.toLowerCase();
      if (!brandMatches) return false;
      if (productName) {
        const normEntryProduct = entry.productName.toLowerCase();
        const normScanProduct = productName.toLowerCase();
        return normEntryProduct.includes(normScanProduct) || normScanProduct.includes(normEntryProduct);
      }
      return true;
    }) || null;
  }

  // Scenario: Exact Match (Barcode matches OR Brand + Product matched)
  if (barcodeMatch) {
    const brandMatches = brand ? barcodeMatch.brand.toLowerCase() === brand.toLowerCase() : true;
    const notes: string[] = [`Barcode ${barcodeValue} matches official record for ${barcodeMatch.brand} ${barcodeMatch.productName}.`];

    if (brand && !brandMatches) {
      // Conflict: Barcode belongs to a different brand!
      return {
        status: 'NO_MATCH',
        statusLabel: 'Mismatch Detected',
        details: `Barcode mismatch: barcode belongs to ${barcodeMatch.brand}, but OCR detected brand "${brand}".`,
        brandMatched: false,
        productMatched: false,
        barcodeMatched: true,
        matchedRecord: barcodeMatch,
        notes: [
          `Detected brand "${brand}" conflicts with database record "${barcodeMatch.brand}".`,
          'Barcode / label mismatch is a notable indicator of counterfeit or mislabeled packaging.'
        ]
      };
    }

    if (productInfo.batchNumber && barcodeMatch.typicalBatchPattern) {
      const pattern = typeof barcodeMatch.typicalBatchPattern === 'string'
        ? new RegExp(barcodeMatch.typicalBatchPattern)
        : barcodeMatch.typicalBatchPattern;
      if (pattern.test(productInfo.batchNumber)) {
        notes.push(`Batch format (${productInfo.batchNumber}) matches expected manufacturer syntax.`);
      } else {
        notes.push(`Batch format (${productInfo.batchNumber}) deviates from standard pattern.`);
      }
    }

    return {
      status: 'MATCHED',
      statusLabel: 'Database Match',
      details: `Matched ${barcodeMatch.brand} ${barcodeMatch.productName} in verified catalog.`,
      brandMatched: true,
      productMatched: true,
      barcodeMatched: true,
      matchedRecord: barcodeMatch,
      notes
    };
  }

  // Scenario: Brand & Product Match, but barcode was not present or unknown
  if (catalogCandidate) {
    const notes: string[] = [`Product matched profile for ${catalogCandidate.brand} ${catalogCandidate.productName}.`];
    if (barcodeValue) {
      notes.push(`Barcode (${barcodeValue}) differs from reference catalog barcode (${catalogCandidate.barcode ?? 'none'}). This may indicate an alternate regional packaging or package size.`);
    } else {
      notes.push('No barcode was provided to confirm against reference GTIN catalog.');
    }

    return {
      status: 'PARTIAL_MATCH',
      statusLabel: 'Partial Catalog Match',
      details: `Recognized brand "${catalogCandidate.brand}" and product "${catalogCandidate.productName}" in catalog.`,
      brandMatched: true,
      productMatched: !!productName,
      barcodeMatched: false,
      matchedRecord: catalogCandidate,
      notes
    };
  }

  // Scenario: Brand is known, but specific product isn't in catalog
  const knownBrandExists = VERIFIED_PRODUCT_CATALOG.some(e => e.brand.toLowerCase() === (brand ?? '').toLowerCase());
  if (knownBrandExists) {
    return {
      status: 'PARTIAL_MATCH',
      statusLabel: 'Known Brand / Unlisted Product',
      details: `Brand "${brand}" is recognized, but this specific variant is not indexed in the local database.`,
      brandMatched: true,
      productMatched: false,
      barcodeMatched: false,
      matchedRecord: null,
      notes: [
        `Brand "${brand}" is registered in the database.`,
        'Specific variant is not present in local reference index. This does not indicate a counterfeit.'
      ]
    };
  }

  // Scenario: Neither brand nor barcode is in database
  // CRITICAL RULE: "Product not found does not mean counterfeit."
  return {
    status: 'UNKNOWN',
    statusLabel: 'Not In Reference Database',
    details: 'Product or brand was not found in the local verification database. Reference database absence does not indicate counterfeit status.',
    brandMatched: false,
    productMatched: false,
    barcodeMatched: false,
    matchedRecord: null,
    notes: [
      'The reference catalog is limited to indexed brands and GTINs.',
      'Absence from this database is neutral and must not be interpreted as counterfeit evidence.'
    ]
  };
}
