import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { formatScanDate, getUserScans } from '@/services/scanService';
import type { ScanRecord } from '@/types/ScanRecord';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    void getUserScans(currentUser.uid)
      .then(setScans)
      .catch((loadError) => {
        console.error('[HISTORY] load failed', loadError);
        setError('We could not load your scan history.');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-semibold">Scan History</h1>
        <p className="text-sm text-gray-400 mt-1">All your past verifications will appear here.</p>
        {loading && <div className="mt-6 bg-white/3 p-6 rounded-lg text-center text-gray-400">Loading scan history...</div>}
        {error && <div className="mt-6 bg-rose-500/10 p-6 rounded-lg text-center text-rose-300">{error}</div>}
        {!loading && !error && !scans.length && <div className="mt-6 bg-white/3 p-6 rounded-lg text-center"><div className="text-gray-400">No history to show yet.</div><Link className="inline-block mt-4 px-4 py-2 rounded bg-cyan-500 text-black" to="/scanner">Scan a product</Link></div>}
        {!!scans.length && <div className="mt-6 space-y-3">{scans.map((scan) => (
          <div key={scan.id} className="bg-white/3 rounded-lg p-4">
            <button onClick={() => setSelectedId(selectedId === scan.id ? null : scan.id)} className="w-full text-left grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <span>{scan.productInfo?.productName ?? 'Product not identified'}</span>
              <span className="text-gray-300">{scan.productInfo?.brand ?? 'Brand not detected'}</span>
              <span className="text-gray-400 text-sm">{formatScanDate(scan.createdAt)}</span>
              <span className="text-cyan-300">{scan.scanStatus}</span>
              <span className="text-gray-400 text-sm">{scan.ocr?.confidence == null ? 'OCR confidence unavailable' : `${Math.round(scan.ocr.confidence * 100)}% OCR`}</span>
            </button>
            {selectedId === scan.id && <div className="mt-4 border-t border-white/10 pt-4 text-sm text-gray-300 whitespace-pre-wrap">{scan.ocr?.rawText || 'No OCR text extracted.'}</div>}
          </div>
        ))}</div>}
      </div>
    </main>
  );
}
