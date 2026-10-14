import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Barcode as BarcodeIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { deleteScan, formatScanDate, getUserScans } from '@/services/scanService';
import type { ScanRecord } from '@/types/ScanRecord';
import type { RiskLevel } from '@/types/AuthenticityResult';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchScans = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const records = await getUserScans(currentUser.uid);
      setScans(records);
    } catch (loadError) {
      console.error('[HISTORY] load failed', loadError);
      setError('We could not retrieve your scan history. Please check your network and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchScans();
  }, [currentUser]);

  const handleDelete = async (scanId: string) => {
    if (!confirm('Are you sure you want to remove this scan from your history?')) return;
    setDeletingId(scanId);
    try {
      await deleteScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      if (selectedScan?.id === scanId) setSelectedScan(null);
    } catch (delError) {
      console.error('[HISTORY] delete failed', delError);
      alert('Could not delete the scan record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRiskInfo = (record: ScanRecord) => {
    const level: RiskLevel = record.riskLevel ||
      (record.authenticity?.riskLevel) ||
      (record.authenticityScore != null && record.authenticityScore >= 75 ? 'LIKELY_GENUINE' :
       record.authenticityScore != null && record.authenticityScore >= 45 ? 'SUSPICIOUS' :
       record.authenticityScore != null && record.authenticityScore > 0 ? 'HIGH_RISK' : 'UNABLE_TO_VERIFY');

    switch (level) {
      case 'LIKELY_GENUINE':
        return {
          label: 'Likely Genuine',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: ShieldCheck,
          textClass: 'text-emerald-400'
        };
      case 'SUSPICIOUS':
        return {
          label: 'Suspicious',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
          textClass: 'text-amber-400'
        };
      case 'HIGH_RISK':
        return {
          label: 'High Risk',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: ShieldAlert,
          textClass: 'text-rose-400'
        };
      case 'UNABLE_TO_VERIFY':
      default:
        return {
          label: 'Unable to Verify',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: HelpCircle,
          textClass: 'text-cyan-400'
        };
    }
  };

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      // Risk filter
      if (selectedRisk !== 'ALL') {
        const info = getRiskInfo(scan);
        if (selectedRisk === 'LIKELY_GENUINE' && info.label !== 'Likely Genuine') return false;
        if (selectedRisk === 'SUSPICIOUS' && info.label !== 'Suspicious') return false;
        if (selectedRisk === 'HIGH_RISK' && info.label !== 'High Risk') return false;
        if (selectedRisk === 'UNABLE_TO_VERIFY' && info.label !== 'Unable to Verify') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const brand = (scan.productInfo?.brand ?? '').toLowerCase();
        const name = (scan.productInfo?.productName ?? '').toLowerCase();
        const barcode = (scan.barcode?.value ?? '').toLowerCase();
        const batch = (scan.productInfo?.batchNumber ?? '').toLowerCase();
        return brand.includes(query) || name.includes(query) || barcode.includes(query) || batch.includes(query);
      }

      return true;
    });
  }, [scans, selectedRisk, searchQuery]);

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Verification History</h1>
            <p className="text-sm text-gray-400 mt-1">Review and manage your past product authenticity verifications.</p>
          </div>
          <Link
            to="/scanner"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition self-start sm:self-auto shadow-lg shadow-cyan-500/20"
          >
            New Product Scan
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, product name, barcode, or batch..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 appearance-none transition cursor-pointer"
            >
              <option value="ALL" className="bg-gray-900">All Risk Levels</option>
              <option value="LIKELY_GENUINE" className="bg-gray-900">Likely Genuine</option>
              <option value="SUSPICIOUS" className="bg-gray-900">Suspicious</option>
              <option value="HIGH_RISK" className="bg-gray-900">High Risk</option>
              <option value="UNABLE_TO_VERIFY" className="bg-gray-900">Unable to Verify</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center bg-white/3 rounded-2xl border border-white/10">
            <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-400">Loading your verification history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-3">
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={() => void fetchScans()}
              className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && scans.length === 0 && (
          <div className="p-12 text-center bg-white/3 rounded-2xl border border-white/10 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">No scans recorded yet</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Once you scan packaging through the TruthScan camera or upload, your verification history will appear here.
              </p>
            </div>
            <Link
              to="/scanner"
              className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition"
            >
              Start First Scan
            </Link>
          </div>
        )}

        {/* No Results from Filter */}
        {!loading && !error && scans.length > 0 && filteredScans.length === 0 && (
          <div className="p-8 text-center bg-white/3 rounded-2xl border border-white/10">
            <p className="text-sm text-gray-400">No scans match your search and filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedRisk('ALL'); }}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-white/10 text-xs text-gray-300 hover:text-white transition"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Scan List */}
        {!loading && !error && filteredScans.length > 0 && (
          <div className="space-y-3">
            {filteredScans.map((scan) => {
              const risk = getRiskInfo(scan);
              const RiskIcon = risk.icon;
              const productName = scan.productInfo?.productName || 'Unlabeled Product';
              const brand = scan.productInfo?.brand || 'Brand unconfirmed';
              const score = scan.authenticityScore ?? scan.authenticity?.authenticityScore ?? 0;

              return (
                <div
                  key={scan.id}
                  className="p-4 bg-white/3 hover:bg-white/5 rounded-xl border border-white/10 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-lg border shrink-0 ${risk.badgeClass}`}>
                      <RiskIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${risk.badgeClass}`}>
                          {risk.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatScanDate(scan.createdAt)}
                        </span>
                        {scan.barcode?.value && (
                          <span className="text-[11px] text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                            {scan.barcode.value}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-white truncate">{productName}</h3>
                      <p className="text-xs text-gray-400">Brand: <span className="text-gray-200">{brand}</span></p>
                    </div>
                  </div>

                  {/* Actions & Score */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div className="text-right">
                      <div className="text-[11px] text-gray-400">Score</div>
                      <div className="text-lg font-bold text-white">{score} <span className="text-xs font-normal text-gray-400">/ 100</span></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center gap-1 transition"
                      >
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => void handleDelete(scan.id)}
                        disabled={deletingId === scan.id}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 transition disabled:opacity-50"
                        title="Delete scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Inspection Modal */}
        {selectedScan && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0b1329] border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-xs text-gray-400">Scan ID: {selectedScan.id}</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {selectedScan.productInfo?.productName || 'Product Verification Inspection'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedScan(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Assessment Summary */}
              {(() => {
                const risk = getRiskInfo(selectedScan);
                const RiskIcon = risk.icon;
                const score = selectedScan.authenticityScore ?? selectedScan.authenticity?.authenticityScore ?? 0;
                const auth = selectedScan.authenticity;
                const dbVerif = selectedScan.databaseVerification;

                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg border ${risk.badgeClass}`}>
                          <RiskIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${risk.badgeClass}`}>
                            {risk.label}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{formatScanDate(selectedScan.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Authenticity Score</div>
                        <div className="text-2xl font-black text-white">{score} <span className="text-xs font-normal text-gray-400">/ 100</span></div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {auth?.explanation && (
                      <div className="p-3 bg-white/3 rounded-lg border border-white/5 text-xs text-gray-300">
                        {auth.explanation}
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/3 p-4 rounded-xl border border-white/5">
                      <div><span className="text-gray-400 block">Brand:</span> <span className="text-white font-medium">{selectedScan.productInfo?.brand || '—'}</span></div>
                      <div><span className="text-gray-400 block">Batch Number:</span> <span className="text-white font-medium">{selectedScan.productInfo?.batchNumber || '—'}</span></div>
                      <div><span className="text-gray-400 block">Mfg Date:</span> <span className="text-white font-medium">{selectedScan.productInfo?.manufacturingDate || '—'}</span></div>
                      <div><span className="text-gray-400 block">Expiry Date:</span> <span className="text-white font-medium">{selectedScan.productInfo?.expiryDate || '—'}</span></div>
                      <div><span className="text-gray-400 block">MRP:</span> <span className="text-white font-medium">{selectedScan.productInfo?.mrp || '—'}</span></div>
                      <div><span className="text-gray-400 block">Catalog Status:</span> <span className="text-cyan-300 font-medium">{dbVerif?.statusLabel || 'Catalog check completed'}</span></div>
                    </div>

                    {/* Positive Signals */}
                    {auth?.positiveIndicators && auth.positiveIndicators.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Positive Indicators
                        </span>
                        <ul className="text-xs text-gray-300 space-y-1 bg-black/20 p-3 rounded-lg border border-white/5">
                          {auth.positiveIndicators.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warning Signals */}
                    {auth?.warningIndicators && auth.warningIndicators.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Anomaly & Warning Flags
                        </span>
                        <ul className="text-xs text-gray-300 space-y-1 bg-black/20 p-3 rounded-lg border border-white/5">
                          {auth.warningIndicators.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Raw OCR Text */}
                    {selectedScan.ocr?.rawText && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-gray-400">Extracted Typography (OCR):</span>
                        <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {selectedScan.ocr.rawText}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end pt-3 border-t border-white/10">
                <button
                  onClick={() => setSelectedScan(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
