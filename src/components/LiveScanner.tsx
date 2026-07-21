import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ScanReport, ScanFeature } from '../types';
import { 
  Upload, Sparkles, CheckCircle2, AlertTriangle, XCircle, 
  RefreshCw, FileText, Share2, History, Database, Camera, Layers, Gauge
} from 'lucide-react';

// Predefined samples for immersive interactive vision simulations
const PRESETS = [
  {
    id: 'sample-genuine',
    brand: 'AuraLuxe Labs',
    productName: 'Molecular Renewal Elixir (Serum)',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    authenticityScore: 99.8,
    status: 'genuine' as const,
    detectedFeatures: [
      { label: 'Primary Brand Logo', confidence: 0.99, x: 25, y: 30, width: 50, height: 15 },
      { label: 'Batch Code #8F2026', confidence: 0.98, x: 35, y: 72, width: 30, height: 8 },
      { label: 'Molecular Seal Index', confidence: 0.96, x: 45, y: 15, width: 10, height: 10 },
      { label: 'UPC Barcode #074299', confidence: 0.99, x: 20, y: 85, width: 60, height: 10 }
    ],
    analysisDetails: {
      logoPlacement: 99.4,
      typographyKerning: 99.8,
      packagingReflectivity: 98.2,
      barcodeMatch: true,
      batchCode: '8F2026'
    },
    logs: [
      'Establishing quantum connection to Ledger...',
      'Initializing high-intensity raster vision scan...',
      'Isolating primary brand logo and trademark geometries...',
      'Analyzing surface material glossiness & micro-reflectivity...',
      'Extracting batch code: #8F2026...',
      'Verifying brand credentials against decentralized crypt-ledger...',
      'Analysis complete: Authentication index fully verified.'
    ]
  },
  {
    id: 'sample-counterfeit',
    brand: 'Éclat Rose',
    productName: 'Hydra-Lustre Premium Gloss',
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600',
    authenticityScore: 14.3,
    status: 'counterfeit' as const,
    detectedFeatures: [
      { label: 'Logo Font Misalignment', confidence: 0.88, x: 20, y: 40, width: 60, height: 12 },
      { label: 'Erroneous Barcode #314589', confidence: 0.94, x: 30, y: 80, width: 40, height: 10 },
      { label: 'Substandard Gloss Texture', confidence: 0.81, x: 10, y: 10, width: 80, height: 80 }
    ],
    analysisDetails: {
      logoPlacement: 42.1,
      typographyKerning: 28.5,
      packagingReflectivity: 12.0,
      barcodeMatch: false,
      batchCode: 'ER-X883'
    },
    logs: [
      'Initializing visual analysis matrices...',
      'CRITICAL: Typographical skew detected on trademark label (+2.4px offset).',
      'Scanning container density index...',
      'WARNING: Surface plastic reflectivity index is 12.0% (standard required: 85%).',
      'Batch code verification: ER-X883 returned UNREGISTERED.',
      'Analyzing micro-texture fiber structures...',
      'Threat Level: HIGH. Packaging patterns indicate systematic counterfeit reproduction.'
    ]
  },
  {
    id: 'sample-suspicious',
    brand: 'Oud Nocturne',
    productName: 'Oud Essence Intense (Perfume)',
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=600',
    authenticityScore: 68.5,
    status: 'suspicious' as const,
    detectedFeatures: [
      { label: 'Batch Code Ref #DX9182', confidence: 0.92, x: 40, y: 75, width: 25, height: 7 },
      { label: 'Cap Metal Reflectivity Deviation', confidence: 0.85, x: 35, y: 10, width: 30, height: 15 }
    ],
    analysisDetails: {
      logoPlacement: 88.5,
      typographyKerning: 91.2,
      packagingReflectivity: 72.3,
      barcodeMatch: true,
      batchCode: 'DX9182'
    },
    logs: [
      'Booting laser grid OCR modules...',
      'Extracting batch identifier DX9182...',
      'Querying Global Ledger history...',
      'WARNING: Batch code scanned 42 times in past 24 hours across multiple geographic regions.',
      'Checking glass container wall thickness consistency...',
      'Slight density deviation detected on packaging bottom (+1.2mm variance).',
      'Threat Level: MED. Potential genuine package refill or high-grade gray-market dual-use.'
    ]
  }
];

export default function LiveScanner() {
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESETS[0] | null>(PRESETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [activeReport, setActiveReport] = useState<ScanReport | null>(null);
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load history from Firestore
  const fetchScanHistory = async () => {
    try {
      const qSnapshot = await getDocs(
        query(collection(db, 'scans'), orderBy('createdAt', 'desc'), limit(10))
      );
      const hist: ScanReport[] = [];
      qSnapshot.forEach((doc) => {
        hist.push({ id: doc.id, ...doc.data() } as ScanReport);
      });
      setReports(hist);
    } catch (err) {
      console.error('Error fetching scans:', err);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, []);

  // Preset Selection
  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    if (isScanning) return;
    setSelectedPreset(preset);
    setCustomImage(null);
    setActiveReport(null);
    setScanStep(0);
    setCurrentLogs([]);
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isScanning) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImage(event.target.result as string);
          setSelectedPreset(null);
          setActiveReport(null);
          setScanStep(0);
          setCurrentLogs([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Start the high-tech computer vision scanning simulation
  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    setCurrentLogs([]);
    setActiveReport(null);

    const simulationLogs = selectedPreset 
      ? selectedPreset.logs 
      : [
          'Initializing external secure frame grabber...',
          'Grid line target locked on uploaded item...',
          'Performing spectral noise reduction and bounding...',
          'Analyzing typography, kerning, and trademark positioning...',
          'Detecting packaging material glass & composite reflectivity...',
          'Submitting fingerprint hash to Global Anti-Counterfeit Ledger...',
          'Compiling local Explainable AI authenticity report...'
        ];

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < simulationLogs.length) {
        setCurrentLogs(prev => [...prev, simulationLogs[logIdx]]);
        setScanStep(logIdx + 1);
        logIdx++;
      } else {
        clearInterval(logInterval);
        completeScan();
      }
    }, 700);
  };

  const completeScan = async () => {
    // Generate a beautiful, realistic scan report based on either active preset or uploaded custom image
    let baseReport: Omit<ScanReport, 'id'>;

    if (selectedPreset) {
      baseReport = {
        imageUrl: selectedPreset.imageUrl,
        authenticityScore: selectedPreset.authenticityScore,
        status: selectedPreset.status,
        detectedFeatures: selectedPreset.detectedFeatures,
        brand: selectedPreset.brand,
        productName: selectedPreset.productName,
        analysisDetails: selectedPreset.analysisDetails,
        createdAt: new Date().toISOString()
      };
    } else {
      // Calculate randomized dynamic but realistic parameters for custom user upload
      const score = Math.floor(Math.random() * 45) + 55; // 55% - 100%
      const status = score > 85 ? 'genuine' : score > 70 ? 'suspicious' : 'counterfeit';
      
      baseReport = {
        imageUrl: customImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
        authenticityScore: score,
        status: status,
        brand: 'Analyzed Item',
        productName: 'User Custom Scan Product',
        detectedFeatures: [
          { label: 'Surface Brand Typeface', confidence: parseFloat((Math.random() * 0.15 + 0.8).toFixed(2)), x: 20, y: 35, width: 60, height: 15 },
          { label: 'Container Bottom Coding', confidence: parseFloat((Math.random() * 0.15 + 0.8).toFixed(2)), x: 30, y: 75, width: 40, height: 10 }
        ],
        analysisDetails: {
          logoPlacement: parseFloat((Math.random() * 15 + 85).toFixed(1)),
          typographyKerning: parseFloat((Math.random() * 15 + 85).toFixed(1)),
          packagingReflectivity: parseFloat((Math.random() * 20 + 75).toFixed(1)),
          barcodeMatch: Math.random() > 0.3,
          batchCode: 'TS-' + Math.floor(100000 + Math.random() * 900000)
        },
        createdAt: new Date().toISOString()
      };
    }

    try {
      // Write to Firestore collection "scans"
      const docRef = await addDoc(collection(db, 'scans'), baseReport);
      const savedReport = { id: docRef.id, ...baseReport };
      setActiveReport(savedReport);
      setIsScanning(false);
      fetchScanHistory(); // Refresh historical logs
    } catch (err) {
      console.error('Error saving scan to Firestore:', err);
      setIsScanning(false);
    }
  };

  const handleShareReport = (id: string) => {
    const reportLink = `${window.location.origin}/reports/${id}`;
    setShareLink(reportLink);
    setShowShareModal(true);
    // Copy to clipboard safely
    navigator.clipboard.writeText(reportLink).catch(() => {});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white max-w-7xl mx-auto px-4" id="live-demo-section">
      
      {/* LEFT COLUMN: Input Selection, Camera, Live Feed (Laser Scanning) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="rounded-2xl glass-panel p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/30 to-violet-500/30" />
          
          <h3 className="text-xl font-display font-medium mb-2 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-cyan" /> Visual Authentication Console
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Upload custom packaging image or initialize one of our real-world luxury presets trained on high-density anti-fraud vectors.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                disabled={isScanning}
                className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                  selectedPreset?.id === preset.id
                    ? 'border-brand-cyan/60 bg-brand-cyan/10'
                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="text-[10px] font-mono tracking-wider text-gray-400 uppercase truncate">
                  {preset.brand}
                </div>
                <div className="text-xs font-semibold truncate mt-1">
                  {preset.status === 'genuine' ? 'Serum' : preset.status === 'counterfeit' ? 'Gloss' : 'Perfume'}
                </div>
                <div className={`mt-2 text-[10px] font-mono font-bold inline-flex px-1.5 py-0.5 rounded ${
                  preset.status === 'genuine' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : preset.status === 'counterfeit' 
                    ? 'bg-red-500/10 text-red-400' 
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {preset.status.toUpperCase()}
                </div>
              </button>
            ))}
          </div>

          {/* Upload Box */}
          <div className="relative aspect-[4/3] rounded-xl bg-black/40 border border-white/10 overflow-hidden group flex items-center justify-center">
            {/* LASER line */}
            {isScanning && (
              <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent animate-laser shadow-[0_0_15px_#06b6d4] z-10" />
            )}

            {/* Display Active Image */}
            {(selectedPreset || customImage) ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/20">
                <img 
                  src={selectedPreset ? selectedPreset.imageUrl : (customImage || '')} 
                  alt="Packaging for verification" 
                  className="w-full h-full object-contain"
                />

                {/* Render bounding boxes on completion */}
                {!isScanning && activeReport && activeReport.detectedFeatures.map((feat, i) => (
                  <div
                    key={i}
                    className="absolute border border-brand-cyan bg-cyan-500/5 animate-pulse flex flex-col justify-between"
                    style={{
                      left: `${feat.x || 10}%`,
                      top: `${feat.y || 10}%`,
                      width: `${feat.width || 40}%`,
                      height: `${feat.height || 20}%`
                    }}
                  >
                    <span className="bg-brand-cyan text-gray-900 font-mono text-[9px] font-bold px-1 py-0.5 self-start shrink-0">
                      {feat.label} ({(feat.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-6 text-center w-full h-full">
                <Upload className="w-10 h-10 text-brand-cyan mb-3 group-hover:scale-110 transition duration-300" />
                <span className="text-sm font-semibold">Drag & Drop Image Here</span>
                <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG (Max 5MB)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={isScanning}
                />
              </label>
            )}

            {/* If uploaded custom image, provide clear option */}
            {customImage && !isScanning && (
              <button
                onClick={() => setCustomImage(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition text-xs border border-white/10"
              >
                Clear File
              </button>
            )}
          </div>

          {/* Interactive Trigger Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={startScan}
              disabled={isScanning || (!selectedPreset && !customImage)}
              className="flex-1 py-3 bg-gradient-to-r from-brand-cyan to-brand-violet hover:from-cyan-400 hover:to-violet-500 disabled:opacity-50 text-gray-900 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition glow-cyan"
            >
              <Sparkles className="w-4 h-4" /> 
              {isScanning ? 'Processing AI Tensor Array...' : 'Initialize Authenticity Scan'}
            </button>
          </div>
        </div>

        {/* Vision Processing Logs Card */}
        <div className="rounded-2xl glass-panel p-6 border border-white/10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-mono tracking-wider text-gray-400 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-violet animate-pulse" /> Real-time Neural Activity Logs
            </h4>
            {isScanning && <RefreshCw className="w-3.5 h-3.5 text-brand-cyan animate-spin" />}
          </div>

          <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto bg-black/30 border border-white/5 rounded-xl p-4 font-mono text-xs text-brand-cyan/85 space-y-2">
            {currentLogs.length === 0 && (
              <div className="text-gray-500 italic text-center pt-10">
                Awaiting scan trigger to begin packet stream diagnostics...
              </div>
            )}
            {currentLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-gray-600 select-none">[{idx + 1}]</span>
                <span className={log.includes('CRITICAL') || log.includes('WARNING') ? 'text-rose-400' : 'text-cyan-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Report Verification Result & Risk Breakdown */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Verification Result Card */}
        <div className="rounded-2xl glass-panel p-6 border border-white/10 flex flex-col relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-xl font-display font-medium mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-brand-cyan" /> Authenticity Matrix Report
          </h3>

          {!activeReport ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Database className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No active report generated.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Trigger the live packaging scan above to generate a cryptographic verify ledger.
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Score radial representation */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle 
                      cx="56" cy="56" r="46" 
                      className="stroke-white/10 fill-none" 
                      strokeWidth="8"
                    />
                    {/* Score fill */}
                    <circle 
                      cx="56" cy="56" r="46" 
                      className={`fill-none transition-all duration-1000 ${
                        activeReport.status === 'genuine' 
                          ? 'stroke-emerald-400' 
                          : activeReport.status === 'suspicious' 
                          ? 'stroke-amber-400' 
                          : 'stroke-rose-500'
                      }`}
                      strokeWidth="8"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * activeReport.authenticityScore) / 100}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold font-mono">
                      {activeReport.authenticityScore}%
                    </span>
                    <span className="block text-[8px] font-mono text-gray-400 uppercase tracking-widest">
                      AUTHENTIC
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-xs font-mono text-gray-400 truncate uppercase">
                    {activeReport.brand}
                  </div>
                  <h4 className="text-lg font-semibold leading-tight font-display text-white">
                    {activeReport.productName}
                  </h4>
                  
                  {/* Status badge */}
                  <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    activeReport.status === 'genuine' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : activeReport.status === 'suspicious' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {activeReport.status === 'genuine' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {activeReport.status === 'suspicious' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {activeReport.status === 'counterfeit' && <XCircle className="w-3.5 h-3.5" />}
                    {activeReport.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Parametric Breakdown Heatmap */}
              <div className="space-y-4 flex-1">
                <div className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1">
                  Fraud Vector Breakdown
                </div>
                
                {/* Logo alignment */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Brand Logo Geometry Placement</span>
                    <span className="font-mono font-bold text-brand-cyan">
                      {activeReport.analysisDetails?.logoPlacement}% match
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-cyan rounded-full transition-all duration-1000" 
                      style={{ width: `${activeReport.analysisDetails?.logoPlacement || 0}%` }}
                    />
                  </div>
                </div>

                {/* Typography alignment */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Typography & Label Kerning</span>
                    <span className="font-mono font-bold text-brand-violet">
                      {activeReport.analysisDetails?.typographyKerning}% match
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-violet rounded-full transition-all duration-1000" 
                      style={{ width: `${activeReport.analysisDetails?.typographyKerning || 0}%` }}
                    />
                  </div>
                </div>

                {/* Material Reflectivity */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Packaging Material Reflectivity Index</span>
                    <span className="font-mono font-bold text-brand-blue">
                      {activeReport.analysisDetails?.packagingReflectivity}% index
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-blue rounded-full transition-all duration-1000" 
                      style={{ width: `${activeReport.analysisDetails?.packagingReflectivity || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 p-3 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
                  <div>
                    <span className="block text-[10px] text-gray-500">BATCH REFERENCE</span>
                    <span className="font-bold text-white">
                      {activeReport.analysisDetails?.batchCode || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500">GLOBAL BARCODE</span>
                    <span className={`font-bold ${activeReport.analysisDetails?.barcodeMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeReport.analysisDetails?.barcodeMatch ? 'VERIFIED MATCH' : 'UNREGISTERED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Share and Register */}
              <div className="mt-6 flex gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => handleShareReport(activeReport.id)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-cyan" /> Share Scan Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scan History (Real-time synced from Firestore) */}
        <div className="rounded-2xl glass-panel p-6 border border-white/10 flex flex-col h-[280px]">
          <h3 className="text-sm font-mono tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
            <History className="w-4 h-4 text-brand-cyan" /> Secure Scan Ledger History
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {reports.length === 0 ? (
              <div className="text-center text-xs text-gray-500 pt-16">
                No scans registered on this client project.
              </div>
            ) : (
              reports.map((rep) => (
                <div 
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    activeReport?.id === rep.id 
                      ? 'border-brand-cyan/40 bg-brand-cyan/5' 
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="truncate pr-4 flex-1">
                    <span className="block text-[10px] font-mono text-gray-500 uppercase">
                      {rep.brand}
                    </span>
                    <span className="font-semibold text-xs text-white truncate block">
                      {rep.productName}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                      {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-mono font-bold text-white">
                      {rep.authenticityScore}%
                    </span>
                    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 ${
                      rep.status === 'genuine' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : rep.status === 'counterfeit' 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Share Report Modal overlay */}
      {showShareModal && shareLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-white/10 text-white shadow-xl">
            <h4 className="text-lg font-display font-medium mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-cyan" /> Secure Ledger Report Shared
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              A cryptographic verifiable copy of this scan report has been compiled and is viewable via the link below.
            </p>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-brand-cyan mb-6">
              <span className="truncate pr-4">{shareLink}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert("Copied to clipboard!");
                }}
                className="px-2.5 py-1 rounded bg-brand-cyan text-gray-900 font-semibold cursor-pointer shrink-0 text-[10px]"
              >
                COPY
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
