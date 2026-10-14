import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Database,
  Barcode as BarcodeIcon,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatScanDate, getUserScans } from '@/services/scanService';
import type { ScanRecord } from '@/types/ScanRecord';
import type { RiskLevel } from '@/types/AuthenticityResult';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReportScan, setActiveReportScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    void getUserScans(currentUser.uid)
      .then(records => {
        setScans(records);
        if (records.length > 0 && !activeReportScan) {
          setActiveReportScan(records[0]);
        }
      })
      .catch((loadError) => {
        console.error('[REPORTS] load failed', loadError);
        setError('We could not retrieve verification reports data.');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Real aggregate statistics based on actual user scans
  const stats = useMemo(() => {
    let genuine = 0;
    let suspicious = 0;
    let highRisk = 0;
    let unableToVerify = 0;
    const brandsSet = new Set<string>();

    scans.forEach(scan => {
      const risk = scan.riskLevel || scan.authenticity?.riskLevel;
      const score = scan.authenticityScore ?? scan.authenticity?.authenticityScore;

      if (risk === 'LIKELY_GENUINE' || (score != null && score >= 75)) genuine++;
      else if (risk === 'SUSPICIOUS' || (score != null && score >= 45)) suspicious++;
      else if (risk === 'HIGH_RISK' || (score != null && score > 0)) highRisk++;
      else unableToVerify++;

      if (scan.productInfo?.brand) brandsSet.add(scan.productInfo.brand.trim());
    });

    return {
      total: scans.length,
      genuine,
      suspicious,
      highRisk,
      unableToVerify,
      brandsCount: brandsSet.size
    };
  }, [scans]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = (scan: ScanRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `truthscan-report-${scan.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskDetails = (scan: ScanRecord) => {
    const level: RiskLevel = scan.riskLevel ||
      scan.authenticity?.riskLevel ||
      (scan.authenticityScore != null && scan.authenticityScore >= 75 ? 'LIKELY_GENUINE' :
       scan.authenticityScore != null && scan.authenticityScore >= 45 ? 'SUSPICIOUS' :
       scan.authenticityScore != null && scan.authenticityScore > 0 ? 'HIGH_RISK' : 'UNABLE_TO_VERIFY');

    switch (level) {
      case 'LIKELY_GENUINE':
        return { label: 'Likely Genuine', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: ShieldCheck, color: 'text-emerald-400' };
      case 'SUSPICIOUS':
        return { label: 'Suspicious', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: AlertTriangle, color: 'text-amber-400' };
      case 'HIGH_RISK':
        return { label: 'High Risk', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: ShieldAlert, color: 'text-rose-400' };
      case 'UNABLE_TO_VERIFY':
      default:
        return { label: 'Unable to Verify', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: HelpCircle, color: 'text-cyan-400' };
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Authenticity Reports</h1>
            <p className="text-sm text-gray-400 mt-1">
              Generate, review, and print verifiable authenticity reports for your scanned products.
            </p>
          </div>
          {activeReportScan && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={() => handleExportJSON(activeReportScan)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          )}
        </div>

        {/* Aggregate Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white/3 rounded-xl border border-white/10">
            <span className="text-xs text-gray-400">Total Reports</span>
            <div className="text-2xl font-bold mt-1 text-white">{stats.total}</div>
          </div>
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <span className="text-xs text-emerald-400">Likely Genuine</span>
            <div className="text-2xl font-bold mt-1 text-emerald-300">{stats.genuine}</div>
          </div>
          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
            <span className="text-xs text-amber-400">Suspicious / Incomplete</span>
            <div className="text-2xl font-bold mt-1 text-amber-300">{stats.suspicious}</div>
          </div>
          <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
            <span className="text-xs text-rose-400">High Risk / Anomalies</span>
            <div className="text-2xl font-bold mt-1 text-rose-300">{stats.highRisk}</div>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading && (
          <div className="p-12 text-center bg-white/3 rounded-2xl border border-white/10">
            <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-400">Loading reports...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-sm text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && scans.length === 0 && (
          <div className="p-12 text-center bg-white/3 rounded-2xl border border-white/10 space-y-4">
            <FileText className="w-12 h-12 text-gray-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-white">No reports generated yet</h3>
              <p className="text-sm text-gray-400 mt-1">Scan a product to generate your first full authenticity report.</p>
            </div>
            <Link
              to="/scanner"
              className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition"
            >
              Scan a Product
            </Link>
          </div>
        )}

        {/* Main Report View & Scan Selector */}
        {!loading && !error && scans.length > 0 && activeReportScan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Scans Selector Sidebar */}
            <div className="bg-white/3 rounded-2xl border border-white/10 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Select Product Scan</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {scans.map(scan => {
                  const risk = getRiskDetails(scan);
                  const isSelected = activeReportScan.id === scan.id;

                  return (
                    <button
                      key={scan.id}
                      onClick={() => setActiveReportScan(scan)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'bg-white/2 hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${risk.badge}`}>
                          {risk.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatScanDate(scan.createdAt)}</span>
                      </div>
                      <div className="font-semibold text-sm text-white mt-1.5 truncate">
                        {scan.productInfo?.productName || 'Unlabeled Product'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {scan.productInfo?.brand || 'Brand unconfirmed'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Printable Official Report Document */}
            <div className="lg:col-span-2 bg-gradient-to-b from-[#0b132b] to-[#040816] rounded-2xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none" id="printable-report">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 print:border-gray-300">
                <div>
                  <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold print:text-blue-800">
                    TruthScan AI — Authenticity Verification Certificate
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-1 print:text-black">
                    {activeReportScan.productInfo?.productName || 'Product Verification Report'}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5 print:text-gray-600">
                    Verification ID: <span className="font-mono text-gray-300 print:text-gray-900">{activeReportScan.id}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs text-gray-400 print:text-gray-600">
                  <div>Date: <span className="font-medium text-white print:text-black">{formatScanDate(activeReportScan.createdAt)}</span></div>
                  <div>Account: <span className="font-mono text-gray-300 print:text-gray-900">{currentUser?.email}</span></div>
                </div>
              </div>

              {/* Assessment Score & Risk Classification */}
              {(() => {
                const risk = getRiskDetails(activeReportScan);
                const score = activeReportScan.authenticityScore ?? activeReportScan.authenticity?.authenticityScore ?? 0;
                const confidence = activeReportScan.authenticity?.confidence ?? 0;
                const auth = activeReportScan.authenticity;

                return (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-white/3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-gray-100 print:border-gray-300">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-600">Risk Assessment</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${risk.badge}`}>
                            {risk.label}
                          </span>
                          <span className="text-xs text-gray-300 print:text-gray-700">
                            Confidence: {confidence}%
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wide print:text-gray-600">Authenticity Score</div>
                        <div className="text-3xl font-black text-white print:text-black">
                          {score} <span className="text-sm font-normal text-gray-400 print:text-gray-600">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {auth?.explanation && (
                      <p className="text-sm text-gray-300 leading-relaxed print:text-gray-800">
                        {auth.explanation}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Verified Product Identity Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-gray-700 border-b border-white/5 pb-1">
                  Product Metadata & Packaging Markers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Brand</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.brand || 'Unidentified'}</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Batch / Lot</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.batchNumber || 'Not detected'}</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Price (MRP)</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.mrp || 'Not detected'}</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Mfg Date</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.manufacturingDate || 'Not detected'}</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Expiry Date</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.expiryDate || 'Not detected'}</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50">
                    <span className="text-gray-400 block print:text-gray-600">Quantity</span>
                    <span className="font-semibold text-white print:text-black">{activeReportScan.productInfo?.netWeight || activeReportScan.productInfo?.volume || 'Not detected'}</span>
                  </div>
                </div>
              </div>

              {/* Optical Codes & Catalog Status */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-gray-700 border-b border-white/5 pb-1">
                  Optical Codes & Catalog Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-400 print:text-gray-600">
                      <BarcodeIcon className="w-3.5 h-3.5" />
                      <span>1D Barcode Detection</span>
                    </div>
                    <div className="font-mono text-white print:text-black">
                      {activeReportScan.barcode?.detected ? `${activeReportScan.barcode.format}: ${activeReportScan.barcode.value}` : 'No barcode detected on scanned face'}
                    </div>
                  </div>

                  <div className="p-3 bg-white/2 rounded-lg print:bg-gray-50 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-400 print:text-gray-600">
                      <Database className="w-3.5 h-3.5" />
                      <span>Reference Catalog Matching</span>
                    </div>
                    <div className="font-medium text-white print:text-black">
                      {activeReportScan.databaseVerification?.statusLabel || 'Catalog check completed'}
                    </div>
                    {activeReportScan.databaseVerification?.details && (
                      <div className="text-[11px] text-gray-400 print:text-gray-600">{activeReportScan.databaseVerification.details}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signal Audit: Positive vs Warning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Positive Signals */}
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 print:bg-gray-50 print:border-gray-200">
                  <div className="font-bold text-emerald-400 print:text-green-800 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Positive Indicators
                  </div>
                  {activeReportScan.authenticity?.positiveIndicators && activeReportScan.authenticity.positiveIndicators.length > 0 ? (
                    <ul className="space-y-1.5 text-gray-300 print:text-gray-800">
                      {activeReportScan.authenticity.positiveIndicators.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No positive indicators identified.</p>
                  )}
                </div>

                {/* Warning Signals */}
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 print:bg-gray-50 print:border-gray-200">
                  <div className="font-bold text-amber-400 print:text-amber-800 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Anomalies & Missing Markers
                  </div>
                  {activeReportScan.authenticity?.warningIndicators && activeReportScan.authenticity.warningIndicators.length > 0 ? (
                    <ul className="space-y-1.5 text-gray-300 print:text-gray-800">
                      {activeReportScan.authenticity.warningIndicators.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-300 print:text-green-800">No packaging anomalies detected.</p>
                  )}
                </div>
              </div>

              {/* Legal Disclaimer & Verification Limitations */}
              <div className="pt-4 border-t border-white/10 text-[10px] text-gray-500 space-y-1 print:text-gray-500 print:border-gray-300">
                <div className="font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">Verification Limitations</div>
                <p>
                  TruthScan AI evaluates product packaging through optical character recognition, barcode verification, and catalog cross-referencing. This assessment does not constitute chemical laboratory verification or brand authorization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
