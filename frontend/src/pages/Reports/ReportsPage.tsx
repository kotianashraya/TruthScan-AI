import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserScans } from '@/services/scanService';
import type { ScanRecord } from '@/types/ScanRecord';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    void getUserScans(currentUser.uid).then(setScans).catch((loadError) => {
      console.error('[REPORTS] load failed', loadError);
      setError('We could not load report data.');
    }).finally(() => setLoading(false));
  }, [currentUser]);

  const brands = new Set(scans.map(scan => scan.productInfo?.brand).filter(Boolean)).size;
  const ocrResults = scans.filter(scan => scan.ocr?.rawText);

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-semibold">Reports</h1>
        <p className="text-sm text-gray-400 mt-1">Generate and download product authenticity reports.</p>
        {loading && <div className="mt-6 bg-white/3 p-6 rounded-lg text-center text-gray-400">Loading report data...</div>}
        {error && <div className="mt-6 bg-rose-500/10 p-6 rounded-lg text-center text-rose-300">{error}</div>}
        {!loading && !error && !scans.length && <div className="mt-6 bg-white/3 p-6 rounded-lg text-center text-gray-400">No completed scans are available for reporting yet.</div>}
        {!loading && !error && !!scans.length && <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4"><Metric label="Total scans" value={scans.length} /><Metric label="OCR results" value={ocrResults.length} /><Metric label="Detected brands" value={brands} /><div className="sm:col-span-3 bg-white/3 p-4 rounded-lg text-sm text-gray-400">Authenticity statistics are unavailable until authenticity verification is implemented.</div></div>}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white/3 p-4 rounded-lg"><div className="text-sm text-gray-300">{label}</div><div className="text-2xl font-semibold mt-2">{value}</div></div>;
}
