import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  FileText,
  History,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Barcode as BarcodeIcon,
  QrCode,
  Calendar,
  Tag
} from 'lucide-react';
import type { ProductDetectionResult } from '@/types/ProductDetectionResult';

interface Props {
  result: ProductDetectionResult;
  onScanAgain: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'failed';
  saveError?: string | null;
  onRetrySave?: () => void;
}

export default function ScanResultView({
  result,
  onScanAgain,
  saveStatus,
  saveError,
  onRetrySave
}: Props) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const auth = result.authenticity;
  const dbVerif = result.databaseVerification;
  const product = result.productInfo ?? {};
  const riskLevel = auth?.riskLevel ?? 'UNABLE_TO_VERIFY';
  const score = auth?.authenticityScore ?? 0;
  const confidence = auth?.confidence ?? 0;

  const copyRawText = () => {
    if (!result.ocr?.rawText) return;
    navigator.clipboard.writeText(result.ocr.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskTheme = () => {
    switch (riskLevel) {
      case 'LIKELY_GENUINE':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'Likely Genuine'
        };
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
          label: 'Suspicious / Incomplete'
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: ShieldAlert,
          label: 'High Risk'
        };
      case 'UNABLE_TO_VERIFY':
      default:
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: HelpCircle,
          label: 'Unable to Verify'
        };
    }
  };

  const theme = getRiskTheme();
  const Icon = theme.icon;

  return (
    <div className="space-y-6">
      {/* Save Notification */}
      {saveStatus && saveStatus !== 'idle' && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
          saveStatus === 'saved'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : saveStatus === 'saving'
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
        }`}>
          <span>
            {saveStatus === 'saving' && 'Persisting scan to cloud history...'}
            {saveStatus === 'saved' && '✓ Scan successfully saved to your history.'}
            {saveStatus === 'failed' && `Scan save failed: ${saveError || 'Cloud storage unavailable'}`}
          </span>
          {saveStatus === 'failed' && onRetrySave && (
            <button
              onClick={onRetrySave}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-semibold text-rose-200 transition"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Primary Risk Assessment Banner */}
      <div className={`p-6 rounded-2xl border ${theme.bg} ${theme.border} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${theme.badgeBg} border`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${theme.badgeBg}`}>
                  {theme.label}
                </span>
                <span className="text-xs text-gray-400">
                  Confidence: {confidence}%
                </span>
              </div>
              <h2 className="text-2xl font-bold mt-1 text-white">
                {product.productName || 'Product Verification Assessment'}
              </h2>
              {product.brand && (
                <p className="text-sm text-gray-300 font-medium">Brand: {product.brand}</p>
              )}
            </div>
          </div>

          {/* Authenticity Score Gauge */}
          <div className="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-xl border border-white/10 self-stretch md:self-auto justify-center">
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Authenticity Score</div>
              <div className="text-2xl font-black text-white">{score} <span className="text-sm font-normal text-gray-400">/ 100</span></div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/10 flex items-center justify-center relative">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={theme.text}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold">{score}</span>
            </div>
          </div>
        </div>

        {/* Assessment Explanation & Recommendation */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          <p className="text-sm text-gray-200 leading-relaxed">
            {auth?.explanation || 'Optical analysis completed. Signals evaluated against verified standards.'}
          </p>
          {auth?.recommendation && (
            <div className="text-xs text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2">
              <span className="font-semibold text-white shrink-0">Recommendation:</span>
              <span>{auth.recommendation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Extracted Product Information & Catalog Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Identifiers */}
        <div className="p-5 bg-white/3 rounded-xl border border-white/10 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            Detected Product Data
          </h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <span className="text-gray-400 block">Brand</span>
              <span className="font-medium text-white">{product.brand || 'Not identified'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Product Designation</span>
              <span className="font-medium text-white">{product.productName || 'Not identified'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Batch / Lot Number</span>
              <span className="font-medium text-white">{product.batchNumber || product.lotNumber || 'Not detected'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Declared Price (MRP)</span>
              <span className="font-medium text-white">{product.mrp || 'Not detected'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Manufacturing Date</span>
              <span className="font-medium text-white">{product.manufacturingDate || 'Not detected'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Expiry / Best Before</span>
              <span className="font-medium text-white">{product.expiryDate || 'Not detected'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Net Quantity</span>
              <span className="font-medium text-white">{product.netWeight || product.volume || 'Not detected'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">SPF / Features</span>
              <span className="font-medium text-white">{product.spf || product.productFeatures?.[0] || 'Standard packaging'}</span>
            </div>
          </div>

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-gray-400 text-xs block">Key Active Ingredients</span>
              <span className="text-xs text-gray-200 mt-0.5 block">{product.ingredients.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Database Verification & Optical Codes */}
        <div className="p-5 bg-white/3 rounded-xl border border-white/10 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-blue" />
            Catalog Cross-Reference & Optical Codes
          </h3>

          <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Database Status:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                dbVerif?.status === 'MATCHED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : dbVerif?.status === 'PARTIAL_MATCH'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : dbVerif?.status === 'NO_MATCH'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-white/10 text-gray-300'
              }`}>
                {dbVerif?.statusLabel || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {dbVerif?.details || 'Database lookup completed.'}
            </p>
          </div>

          {/* Barcode & QR Details */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-gray-400">
                <BarcodeIcon className="w-3.5 h-3.5" />
                <span>1D Barcode</span>
              </div>
              <div className="font-mono text-[11px] mt-1 break-all text-white">
                {result.barcode.detected ? `${result.barcode.format}: ${result.barcode.value}` : 'None detected'}
              </div>
            </div>

            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-gray-400">
                <QrCode className="w-3.5 h-3.5" />
                <span>2D / QR Code</span>
              </div>
              <div className="font-mono text-[11px] mt-1 break-all text-white truncate">
                {result.qr.detected ? (result.qr.url || result.qr.rawValue || 'Detected') : 'None detected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal AI Vision Assessment */}
      {result.visionAssessment?.status === 'COMPLETED' && (
        <div className="p-5 bg-white/3 rounded-xl border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">
            AI Vision Assessment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <span className="text-gray-400 block">Model</span>
              <span className="font-medium text-white">{result.visionAssessment.model || 'Configured model'}</span>
            </div>
            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <span className="text-gray-400 block">AI Confidence</span>
              <span className="font-medium text-white">{result.visionAssessment.confidence}%</span>
            </div>
            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <span className="text-gray-400 block">Packaging Consistency</span>
              <span className="font-medium text-white">{result.visionAssessment.packagingConsistency.replaceAll('_', ' ')}</span>
            </div>
            <div className="p-2.5 bg-black/20 rounded border border-white/5">
              <span className="text-gray-400 block">AI Risk Hint</span>
              <span className="font-medium text-white">{result.visionAssessment.aiRiskHint.replaceAll('_', ' ')}</span>
            </div>
          </div>

          {result.visionAssessment.packagingObservations.length > 0 && (
            <div>
              <span className="text-gray-400 text-xs block mb-1">Visible Packaging Observations</span>
              <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                {result.visionAssessment.packagingObservations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}

          {result.visionAssessment.visibleTextIssues.length > 0 && (
            <div>
              <span className="text-amber-400 text-xs block mb-1">Visible Text Issues</span>
              <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                {result.visionAssessment.visibleTextIssues.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}

          {result.visionAssessment.tamperEvidence.length > 0 && (
            <div>
              <span className="text-rose-400 text-xs block mb-1">Possible Tamper Observations</span>
              <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                {result.visionAssessment.tamperEvidence.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-gray-500">
            AI vision is supporting evidence only. It does not certify authenticity and cannot verify laboratory-level or hidden anti-counterfeit features from a 2D image.
          </p>
        </div>
      )}

      {/* Indicators Breakdown: Positive vs Warning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive Indicators */}
        <div className="p-5 bg-white/3 rounded-xl border border-white/10">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Positive Signals ({auth?.positiveIndicators?.length ?? 0})
          </h3>
          {auth?.positiveIndicators && auth.positiveIndicators.length > 0 ? (
            <ul className="space-y-2 text-xs text-gray-300">
              {auth.positiveIndicators.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">No positive verification signals identified.</p>
          )}
        </div>

        {/* Warning Indicators */}
        <div className="p-5 bg-white/3 rounded-xl border border-white/10">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            Warning Signs & Missing Signals ({auth?.warningIndicators?.length ?? 0})
          </h3>
          {auth?.warningIndicators && auth.warningIndicators.length > 0 ? (
            <ul className="space-y-2 text-xs text-gray-300">
              {auth.warningIndicators.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-300">No anomaly or conflict flags detected.</p>
          )}
        </div>
      </div>

      {/* Technical Forensics Accordion */}
      <div className="bg-white/3 rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-semibold text-gray-300 hover:bg-white/5 transition"
        >
          <span>Technical Forensics & OCR Text</span>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-white/10 space-y-4 text-xs">
            {/* Timings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-400">
              <div className="bg-black/20 p-2 rounded">
                <span>Total Processing:</span> <span className="text-white font-mono">{result.processingTimeMs} ms</span>
              </div>
              <div className="bg-black/20 p-2 rounded">
                <span>OCR Duration:</span> <span className="text-white font-mono">{Math.round(result.ocrProcessingTimeMs ?? 0)} ms</span>
              </div>
              <div className="bg-black/20 p-2 rounded">
                <span>OCR Confidence:</span> <span className="text-white font-mono">{result.ocr?.confidence != null ? `${Math.round(result.ocr.confidence * 100)}%` : 'N/A'}</span>
              </div>
              <div className="bg-black/20 p-2 rounded">
                <span>Parser Completeness:</span> <span className="text-white font-mono">{product.parserConfidence ?? 0}%</span>
              </div>
            </div>

            {/* Raw OCR Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-gray-400">
                <span>Raw Extracted OCR Typography:</span>
                {result.ocr?.rawText && (
                  <button
                    onClick={copyRawText}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="p-3 bg-black/40 rounded border border-white/5 font-mono text-[11px] text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {result.ocr?.rawText || 'No typography was detected.'}
              </div>
            </div>

            {/* Multi-Face Optical Diagnostics */}
            {result.diagnostics && result.diagnostics.faces.length > 1 && (
              <div>
                <span className="text-gray-400 block mb-1.5 font-medium">Multi-Face Packaging Evidence Breakdown:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.diagnostics.faces.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1 text-[11px] font-mono">
                      <div className="text-cyan-300 font-semibold">{f.label}</div>
                      <div className="text-gray-400">Dimensions: {f.dimensions ? `${f.dimensions.width}×${f.dimensions.height} px` : 'N/A'}</div>
                      <div className="text-gray-400">Orientation: {f.orientation}</div>
                      <div className="text-gray-400">OCR: {f.ocrConfidence != null ? `${Math.round(f.ocrConfidence * 100)}%` : 'N/A'} (rot: {f.ocrRotationUsed ?? 0}°)</div>
                      <div className="text-gray-400">Barcode: {f.barcodeResult?.detected ? `${f.barcodeResult.format}: ${f.barcodeResult.value}` : 'None'}</div>
                      <div className="text-gray-400">QR: {f.qrResult?.detected ? 'Detected' : 'None'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observed Evidence Log */}
            {auth?.evidence && auth.evidence.length > 0 && (
              <div>
                <span className="text-gray-400 block mb-1">Audit Trail & Observed Facts:</span>
                <ul className="space-y-1 font-mono text-[11px] text-gray-400 bg-black/20 p-2.5 rounded">
                  {auth.evidence.map((entry, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400">[FACT]</span>
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Limitations & Disclaimer */}
      <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-1.5">
        <div className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">Verification Limitations & Legal Notice</div>
        <ul className="list-disc list-inside space-y-1">
          {auth?.verificationLimitations?.map((limit, idx) => (
            <li key={idx}>{limit}</li>
          ))}
        </ul>
        <p className="pt-1 text-gray-400">
          Disclaimer: TruthScan AI provides deterministic and probabilistic authenticity risk assessments based on optical scanning and packaging indicators. This assessment does not constitute a legal authenticity certification or chemical guarantee.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onScanAgain}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Another Product
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm flex items-center gap-1.5 border border-white/10 transition"
          >
            <History className="w-4 h-4" />
            View History
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm flex items-center gap-1.5 border border-white/10 transition"
          >
            <FileText className="w-4 h-4" />
            Full Reports
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm flex items-center gap-1.5 border border-white/10 transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
