export interface ScanFeature {
  label: string;
  confidence: number;
  x?: number; // bounding box X (%)
  y?: number; // bounding box Y (%)
  width?: number; // bounding box width (%)
  height?: number; // bounding box height (%)
}

export interface ScanReport {
  id: string;
  imageUrl: string;
  authenticityScore: number;
  status: 'genuine' | 'suspicious' | 'counterfeit';
  detectedFeatures: ScanFeature[];
  createdAt: string;
  brand?: string;
  productName?: string;
  analysisDetails?: {
    logoPlacement: number; // score 0-100
    typographyKerning: number; // score 0-100
    packagingReflectivity: number; // score 0-100
    barcodeMatch: boolean;
    batchCode: string;
  };
}

export interface WaitlistLead {
  id?: string;
  name: string;
  email: string;
  role: string; // Organization Type: Brand, Retailer, Consumer
  volume: string; // Expected scan volume or size
  createdAt: string;
  queueNumber?: number;
}
