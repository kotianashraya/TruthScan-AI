import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatScanDate, getUserScans } from '@/services/scanService';

export default function RecentScans() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const records = await getUserScans(currentUser.uid);
        setScans(records.slice(0, 5));
      } catch (e) {
        setScans([]);
      }
    };
    void load();
  }, [currentUser]);

  if (!scans.length) {
    return (
      <div className="p-6 bg-white/3 rounded-lg text-center">
        <div className="text-lg font-semibold">No scans yet</div>
        <div className="text-sm text-gray-400 mt-2">Start your first product verification to see results here.</div>
        <div className="mt-4"><a className="inline-block px-4 py-2 bg-cyan-500 text-black rounded-lg" href="/scanner">Scan Your First Product</a></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white/3 rounded-lg">
      <table className="min-w-full text-left">
        <thead className="text-sm text-gray-400">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Brand</th>
            <th className="p-3">Date</th>
            <th className="p-3">Result</th>
            <th className="p-3">Confidence</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {scans.map(s => (
            <tr key={s.id} className="border-t border-white/5">
              <td className="p-3">{s.productName ?? '—'}</td>
              <td className="p-3">{s.brand ?? '—'}</td>
              <td className="p-3">{formatScanDate(s.createdAt)}</td>
              <td className="p-3">{s.scanStatus}</td>
              <td className="p-3">{s.ocr?.confidence == null ? '—' : `${Math.round(s.ocr.confidence * 100)}%`}</td>
              <td className="p-3"><a className="text-cyan-300" href={`/history`}>View</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
