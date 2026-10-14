import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { formatScanDate, getUserScans } from '@/services/scanService';
import type { ScanRecord } from '@/types/ScanRecord';
import type { RiskLevel } from '@/types/AuthenticityResult';

export default function RecentScans() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);

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

  const getRiskBadge = (scan: ScanRecord) => {
    const level: RiskLevel = scan.riskLevel ||
      scan.authenticity?.riskLevel ||
      (scan.authenticityScore != null && scan.authenticityScore >= 75 ? 'LIKELY_GENUINE' :
       scan.authenticityScore != null && scan.authenticityScore >= 45 ? 'SUSPICIOUS' :
       scan.authenticityScore != null && scan.authenticityScore > 0 ? 'HIGH_RISK' : 'UNABLE_TO_VERIFY');

    switch (level) {
      case 'LIKELY_GENUINE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Likely Genuine</span>;
      case 'SUSPICIOUS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Suspicious</span>;
      case 'HIGH_RISK':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">High Risk</span>;
      case 'UNABLE_TO_VERIFY':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Unverified</span>;
    }
  };

  if (!scans.length) {
    return (
      <div className="p-8 bg-white/3 rounded-2xl border border-white/10 text-center">
        <div className="text-base font-semibold text-white">No scans recorded yet</div>
        <div className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Start your first product verification to see your recent scan results here.</div>
        <div className="mt-4">
          <Link className="inline-block px-4 py-2 bg-cyan-500 text-black font-semibold text-xs rounded-xl hover:bg-cyan-400 transition" to="/scanner">
            Scan Your First Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/3 rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-200 uppercase tracking-wider">Recent Verifications</h3>
        <Link to="/history" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">View All</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="text-gray-400 border-b border-white/5">
            <tr>
              <th className="pb-3 font-medium">Product Designation</th>
              <th className="pb-3 font-medium">Brand</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Assessment</th>
              <th className="pb-3 font-medium">Score</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scans.map(s => {
              const productName = s.productInfo?.productName || 'Unlabeled Product';
              const brand = s.productInfo?.brand || '—';
              const score = s.authenticityScore ?? s.authenticity?.authenticityScore;

              return (
                <tr key={s.id} className="hover:bg-white/2 transition">
                  <td className="py-3 font-medium text-white max-w-[180px] truncate">{productName}</td>
                  <td className="py-3 text-gray-300">{brand}</td>
                  <td className="py-3 text-gray-400">{formatScanDate(s.createdAt)}</td>
                  <td className="py-3">{getRiskBadge(s)}</td>
                  <td className="py-3 text-white font-bold">{score != null ? `${score}/100` : '—'}</td>
                  <td className="py-3 text-right">
                    <Link className="text-cyan-400 hover:text-cyan-300 font-semibold" to="/history">
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
