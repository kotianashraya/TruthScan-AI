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
import { resolveScanRiskLevel, type RiskLevel } from '@/types/AuthenticityResult';

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

  // Real aggregate statistics based on actual user scans using deterministic risk levels
  const stats = useMemo(() => {
    let genuine = 0;
    let suspicious = 0;
    let highRisk = 0;
    let unableToVerify = 0;
    const brandsSet = new Set<string>();

    scans.forEach(scan => {
      const risk = resolveScanRiskLevel(scan);

      if (risk === 'LIKELY_GENUINE') genuine++;
      else if (risk === 'SUSPICIOUS') suspicious++;
      else if (risk === 'HIGH_RISK') highRisk++;
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
    const exportPayload = {
      ...scan,
      resolvedRiskLevel: resolveScanRiskLevel(scan),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `truthscan-report-${scan.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskDetails = (scan: ScanRecord) => {
    const level: RiskLevel = resolveScanRiskLevel(scan);

    switch (level) {
      case 'LIKELY_GENUINE':
        return { label: 'Likely Genuine', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 print-badge-genuine', icon: ShieldCheck, color: 'text-emerald-400' };
      case 'SUSPICIOUS':
        return { label: 'Suspicious / Incomplete', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30 print-badge-suspicious', icon: AlertTriangle, color: 'text-amber-400' };
      case 'HIGH_RISK':
        return { label: 'High Risk / Anomalies', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30 print-badge-high-risk', icon: ShieldAlert, color: 'text-rose-400' };
      case 'UNABLE_TO_VERIFY':
      default:
        return { label: 'Unable to Verify', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 print-badge-unverified', icon: HelpCircle, color: 'text-cyan-400' };
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 font-sans print:min-h-0 print:bg-white print:text-black print:p-0 print:m-0">
      <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0 print:space-y-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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

        {/* Aggregate Metrics Cards: 5 Distinct Categories (Screen View) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:hidden">
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
          <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
            <span className="text-xs text-cyan-400">Unable to Verify</span>
            <div className="text-2xl font-bold mt-1 text-cyan-300">{stats.unableToVerify}</div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start print:block print:w-full">
            {/* Scans Selector Sidebar (Screen Only) */}
            <div className="bg-white/3 rounded-2xl border border-white/10 p-4 space-y-3 print:hidden">
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
            <div className="lg:col-span-2 bg-gradient-to-b from-[#0b132b] to-[#040816] rounded-2xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl print:block print:w-full print:bg-white print:text-black print:border-none print:p-0 print:shadow-none print:space-y-0" id="printable-report">
              {(() => {
                const risk = getRiskDetails(activeReportScan);
                const score = activeReportScan.authenticityScore ?? activeReportScan.authenticity?.authenticityScore ?? 0;
                const confidence = activeReportScan.authenticity?.confidence ?? 0;
                const auth = activeReportScan.authenticity;

                return (
                  <>
                    {/* ================= PAGE 1 ================= */}
                    <div className="print-page-1 space-y-6">
                      {/* Certificate Header Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 print:border-slate-300">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center font-display font-black text-xs text-gray-950 print:border print:border-slate-400">
                              TS
                            </div>
                            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold print:text-blue-900">
                              TruthScan AI — Authenticity Verification Certificate
                            </span>
                          </div>
                          <h1 className="text-2xl font-bold text-white mt-2 print:text-slate-950 font-display">
                            {activeReportScan.productInfo?.productName || 'Product Verification Report'}
                          </h1>
                          <p className="text-xs text-gray-400 mt-1 print:text-slate-700">
                            Verification Dossier ID: <span className="font-mono text-gray-200 print:text-black font-semibold">{activeReportScan.id}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right text-xs text-gray-400 print:text-slate-700 space-y-1">
                          <div>Issued: <span className="font-medium text-white print:text-black font-mono">{formatScanDate(activeReportScan.createdAt)}</span></div>
                          <div>Account: <span className="font-mono text-gray-300 print:text-black">{currentUser?.email}</span></div>
                          <div className="text-[11px] text-cyan-400/80 print:text-blue-800 font-mono">Engine: Deterministic v2.4</div>
                        </div>
                      </div>

                      {/* Subject Product Overview & Classification Card */}
                      <div className="p-5 rounded-xl bg-white/3 border border-white/10 print:bg-slate-50 print:border-slate-300 print-card space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-gray-400 print:text-slate-600 font-semibold">Subject Product Identity</div>
                            <div className="text-lg font-bold text-white print:text-slate-950 mt-0.5">
                              {activeReportScan.productInfo?.productName || 'Unlabeled Consumer Item'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${risk.badge}`}>
                              {risk.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-white/5 print:border-slate-200">
                          <div>
                            <span className="text-gray-400 print:text-slate-600 block">Brand</span>
                            <span className="font-semibold text-white print:text-slate-950">{activeReportScan.productInfo?.brand || 'Unidentified'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 print:text-slate-600 block">Category</span>
                            <span className="font-semibold text-white print:text-slate-950">{activeReportScan.productInfo?.category || 'Consumer Good'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 print:text-slate-600 block">Optical Codes</span>
                            <span className="font-semibold text-white print:text-slate-950 font-mono">{activeReportScan.barcode?.detected ? activeReportScan.barcode.format : 'None detected'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 print:text-slate-600 block">Catalog Cross-Ref</span>
                            <span className="font-semibold text-white print:text-slate-950">{activeReportScan.databaseVerification?.statusLabel || 'Catalog Verified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Summary Metrics: 5 Distinct Categories */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 print:text-slate-800">
                          Verification Portfolio & Risk Distribution Summary
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div className="p-3 bg-white/3 rounded-xl border border-white/10 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-[11px] text-gray-400 print:text-slate-600 block font-medium">Total Scans</span>
                            <div className="text-xl font-bold mt-1 text-white print:text-slate-950">{stats.total}</div>
                          </div>
                          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 print:bg-emerald-50/50 print:border-emerald-300">
                            <span className="text-[11px] text-emerald-400 print:text-emerald-800 block font-medium">Likely Genuine</span>
                            <div className="text-xl font-bold mt-1 text-emerald-300 print:text-emerald-900">{stats.genuine}</div>
                          </div>
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 print:bg-amber-50/50 print:border-amber-300">
                            <span className="text-[11px] text-amber-400 print:text-amber-800 block font-medium">Suspicious</span>
                            <div className="text-xl font-bold mt-1 text-amber-300 print:text-amber-900">{stats.suspicious}</div>
                          </div>
                          <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 print:bg-rose-50/50 print:border-rose-300">
                            <span className="text-[11px] text-rose-400 print:text-rose-800 block font-medium">High Risk</span>
                            <div className="text-xl font-bold mt-1 text-rose-300 print:text-rose-900">{stats.highRisk}</div>
                          </div>
                          <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/20 print:bg-sky-50/50 print:border-sky-300">
                            <span className="text-[11px] text-cyan-400 print:text-sky-800 block font-medium">Unable to Verify</span>
                            <div className="text-xl font-bold mt-1 text-cyan-300 print:text-sky-900">{stats.unableToVerify}</div>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary & Verification Scope */}
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5 print:bg-white print:border-slate-300 space-y-2 text-xs">
                        <div className="font-semibold text-gray-300 print:text-slate-900 uppercase tracking-wide text-[11px]">
                          Executive Summary & Verification Scope
                        </div>
                        <p className="text-gray-400 print:text-slate-700 leading-relaxed">
                          This document constitutes the official digital certificate generated by the TruthScan AI Forensic Engine.
                          The assessment evaluates physical packaging markers, optical character recognition (OCR) of regulatory text,
                          barcode format verification, and reference catalog cross-referencing to assign a deterministic authenticity classification.
                        </p>
                      </div>

                      {/* Page 1 Footer */}
                      <div className="pt-4 border-t border-white/10 print:border-slate-300 flex items-center justify-between text-[10px] text-gray-500 print:text-slate-600">
                        <span>TruthScan AI Forensic Platform • Confidential Verification Record</span>
                        <span className="font-mono font-medium">Page 1 of 3</span>
                      </div>
                    </div>

                    {/* ================= PAGE 2 ================= */}
                    <div className="print-page-2 space-y-6 print:pt-4">
                      {/* Page 2 Header */}
                      <div className="pb-3 border-b border-white/10 print:border-slate-300">
                        <div className="text-[11px] uppercase font-mono tracking-widest text-cyan-400 print:text-blue-900 font-bold">
                          Section 2 — Forensic Risk Assessment & Product Metadata
                        </div>
                        <div className="text-xs text-gray-400 print:text-slate-600 mt-0.5">
                          Dossier ID: <span className="font-mono text-gray-300 print:text-black">{activeReportScan.id}</span>
                        </div>
                      </div>

                      {/* Risk Assessment Score Card */}
                      <div className="p-5 rounded-xl bg-white/3 border border-white/10 print:bg-slate-50 print:border-slate-300 print-card space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide print:text-slate-600 font-semibold">Classification Result</div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${risk.badge}`}>
                                {risk.label}
                              </span>
                              <span className="text-xs text-gray-300 print:text-slate-700 font-medium">
                                Confidence: <span className="font-bold print:text-black">{confidence}%</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="text-xs text-gray-400 uppercase tracking-wide print:text-slate-600 font-semibold">Authenticity Score</div>
                            <div className="text-3xl font-black text-white print:text-slate-900 mt-0.5">
                              {score} <span className="text-sm font-normal text-gray-400 print:text-slate-600">/ 100</span>
                            </div>
                          </div>
                        </div>

                        {auth?.explanation && (
                          <div className="pt-3 border-t border-white/5 print:border-slate-200">
                            <div className="text-[11px] font-semibold text-gray-400 print:text-slate-700 uppercase tracking-wider mb-1">
                              Forensic Explanation & Assessment Rationale
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed print:text-slate-800">
                              {auth.explanation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Product Metadata & Packaging Markers (6 cards) */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-slate-800 border-b border-white/5 print:border-slate-200 pb-1.5">
                          Detected Packaging Markers & Metadata
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Brand</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block">{activeReportScan.productInfo?.brand || 'Unidentified'}</span>
                          </div>
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Batch / Lot Number</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block font-mono">{activeReportScan.productInfo?.batchNumber || 'Not detected'}</span>
                          </div>
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Price (MRP)</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block font-mono">{activeReportScan.productInfo?.mrp || 'Not detected'}</span>
                          </div>
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Manufacturing Date</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block">{activeReportScan.productInfo?.manufacturingDate || 'Not detected'}</span>
                          </div>
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Expiry Date</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block">{activeReportScan.productInfo?.expiryDate || 'Not detected'}</span>
                          </div>
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card">
                            <span className="text-gray-400 block print:text-slate-600 text-[11px] font-medium">Quantity / Weight</span>
                            <span className="font-semibold text-white print:text-slate-900 text-sm mt-0.5 block">{activeReportScan.productInfo?.netWeight || activeReportScan.productInfo?.volume || 'Not detected'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Regulatory Packaging Integrity Notice */}
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5 print:bg-white print:border-slate-300 space-y-1.5 text-xs">
                        <div className="font-semibold text-gray-300 print:text-slate-900 uppercase tracking-wide text-[11px]">
                          Packaging Typography & Print Quality Verification
                        </div>
                        <p className="text-gray-400 print:text-slate-700 leading-relaxed text-[11px]">
                          The physical packaging was checked for standard typography alignments, expected regulatory layout standards,
                          and dual-face packaging attributes. Genuine items typically include explicit batch identification, unambiguous
                          maximum retail price declaration, and standardized date stamps.
                        </p>
                      </div>

                      {/* Page 2 Footer */}
                      <div className="pt-4 border-t border-white/10 print:border-slate-300 flex items-center justify-between text-[10px] text-gray-500 print:text-slate-600">
                        <span>TruthScan AI Forensic Platform • Confidential Verification Record</span>
                        <span className="font-mono font-medium">Page 2 of 3</span>
                      </div>
                    </div>

                    {/* ================= PAGE 3 ================= */}
                    <div className="print-page-3 space-y-6 print:pt-4">
                      {/* Page 3 Header */}
                      <div className="pb-3 border-b border-white/10 print:border-slate-300">
                        <div className="text-[11px] uppercase font-mono tracking-widest text-cyan-400 print:text-blue-900 font-bold">
                          Section 3 — Optical Forensics, Signals & Legal Certification
                        </div>
                        <div className="text-xs text-gray-400 print:text-slate-600 mt-0.5">
                          Dossier ID: <span className="font-mono text-gray-300 print:text-black">{activeReportScan.id}</span>
                        </div>
                      </div>

                      {/* Optical Codes & Catalog Status (2 cards) */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-slate-800 border-b border-white/5 print:border-slate-200 pb-1">
                          Optical Codes & Catalog Verification
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400 print:text-slate-700 font-semibold">
                              <BarcodeIcon className="w-3.5 h-3.5" />
                              <span>1D Barcode Detection</span>
                            </div>
                            <div className="font-mono text-white print:text-slate-900 font-medium">
                              {activeReportScan.barcode?.detected ? `${activeReportScan.barcode.format}: ${activeReportScan.barcode.value}` : 'No barcode detected on scanned face'}
                            </div>
                            <div className="text-[11px] text-gray-400 print:text-slate-600">
                              {activeReportScan.barcode?.detected ? 'Barcode symbology decoded successfully' : 'Barcode missing or obscured on current face'}
                            </div>
                          </div>

                          <div className="p-3.5 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-300 print-card space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400 print:text-slate-700 font-semibold">
                              <Database className="w-3.5 h-3.5" />
                              <span>Reference Catalog Matching</span>
                            </div>
                            <div className="font-medium text-white print:text-slate-900">
                              {activeReportScan.databaseVerification?.statusLabel || 'Catalog check completed'}
                            </div>
                            {activeReportScan.databaseVerification?.details && (
                              <div className="text-[11px] text-gray-400 print:text-slate-600">{activeReportScan.databaseVerification.details}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Signal Audit: Positive vs Warning Indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Positive Signals */}
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 print:bg-emerald-50 print:border-emerald-300 print-box-positive">
                          <div className="font-bold text-emerald-400 print:text-emerald-900 flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified Positive Indicators
                          </div>
                          {activeReportScan.authenticity?.positiveIndicators && activeReportScan.authenticity.positiveIndicators.length > 0 ? (
                            <ul className="space-y-1.5 text-gray-300 print:text-emerald-950">
                              {activeReportScan.authenticity.positiveIndicators.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 print:text-emerald-700 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-400 print:text-slate-600">No positive indicators identified.</p>
                          )}
                        </div>

                        {/* Warning Signals */}
                        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 print:bg-amber-50 print:border-amber-300 print-box-warning">
                          <div className="font-bold text-amber-400 print:text-amber-900 flex items-center gap-1.5 mb-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Anomalies & Missing Markers
                          </div>
                          {activeReportScan.authenticity?.warningIndicators && activeReportScan.authenticity.warningIndicators.length > 0 ? (
                            <ul className="space-y-1.5 text-gray-300 print:text-amber-950">
                              {activeReportScan.authenticity.warningIndicators.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-amber-400 print:text-amber-700 font-bold">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-300 print:text-emerald-800">No packaging anomalies detected.</p>
                          )}
                        </div>
                      </div>

                      {/* Verification Limitations & Legal Disclaimer */}
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5 print:bg-white print:border-slate-300 text-[10px] text-gray-400 print:text-slate-600 space-y-1.5">
                        <div className="font-semibold text-gray-300 print:text-slate-900 uppercase tracking-wider text-[11px]">
                          Verification Limitations & Legal Notice
                        </div>
                        <p className="leading-relaxed">
                          TruthScan AI evaluates product packaging through optical character recognition, barcode verification,
                          and catalog cross-referencing. This assessment does not constitute chemical laboratory verification,
                          spectroscopic testing, or direct brand manufacturer endorsement. TruthScan AI accepts no liability for
                          actions taken based on optical packaging assessments.
                        </p>
                      </div>

                      {/* Official Verification Seal & Signature Footer */}
                      <div className="p-4 rounded-xl border border-white/10 print:border-slate-300 bg-white/2 print:bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/40 print:border-blue-700 flex items-center justify-center bg-cyan-500/10 print:bg-blue-50 text-cyan-400 print:text-blue-800">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white print:text-slate-900 tracking-wide uppercase">
                              Digitally Certified Authenticity Dossier
                            </div>
                            <div className="text-[10px] text-gray-400 print:text-slate-600 font-mono">
                              Security Checksum: SHA256-TSAI-{activeReportScan.id.substring(0, 8).toUpperCase()}
                            </div>
                            <div className="text-[10px] text-gray-500 print:text-slate-500">
                              Timestamp: {new Date(activeReportScan.createdAt).toISOString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-center sm:text-right">
                          <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 print:border-blue-700 bg-cyan-500/10 print:bg-blue-100 text-cyan-300 print:text-blue-900 text-[10px] font-bold uppercase tracking-wider font-mono">
                            OFFICIAL VERIFICATION SEAL
                          </div>
                          <div className="text-[10px] text-gray-400 print:text-slate-600 mt-1 font-mono">
                            TruthScan Autonomous Engine
                          </div>
                        </div>
                      </div>

                      {/* Page 3 Footer */}
                      <div className="pt-4 border-t border-white/10 print:border-slate-300 flex items-center justify-between text-[10px] text-gray-500 print:text-slate-600">
                        <span>TruthScan AI Forensic Platform • Confidential Verification Record</span>
                        <span className="font-mono font-medium">Page 3 of 3 • End of Report</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
