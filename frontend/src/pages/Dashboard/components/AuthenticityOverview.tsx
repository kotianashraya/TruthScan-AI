import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserScans } from '@/services/scanService';
import { resolveScanRiskLevel } from '@/types/AuthenticityResult';

export default function AuthenticityOverview() {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({ genuine: 0, suspicious: 0, highRisk: 0, unverified: 0, total: 0 });

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const docs = await getUserScans(currentUser.uid);
        let genuine = 0;
        let suspicious = 0;
        let highRisk = 0;
        let unverified = 0;

        docs.forEach(doc => {
          const risk = resolveScanRiskLevel(doc);
          if (risk === 'LIKELY_GENUINE') genuine++;
          else if (risk === 'SUSPICIOUS') suspicious++;
          else if (risk === 'HIGH_RISK') highRisk++;
          else unverified++;
        });

        setCounts({ genuine, suspicious, highRisk, unverified, total: docs.length });
      } catch (e) {
        setCounts({ genuine: 0, suspicious: 0, highRisk: 0, unverified: 0, total: 0 });
      }
    };
    void load();
  }, [currentUser]);

  const pct = (val: number) => counts.total > 0 ? Math.round((val / counts.total) * 100) : 0;

  return (
    <div className="p-5 bg-white/3 rounded-2xl border border-white/10 space-y-4">
      <h3 className="font-semibold text-sm text-gray-200 uppercase tracking-wider">Authenticity Overview</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="text-[11px] text-emerald-400 font-medium">Genuine</div>
          <div className="text-xl font-bold text-emerald-300 mt-0.5">{counts.genuine}</div>
          <div className="text-[10px] text-gray-400">{pct(counts.genuine)}%</div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="text-[11px] text-amber-400 font-medium">Suspicious</div>
          <div className="text-xl font-bold text-amber-300 mt-0.5">{counts.suspicious}</div>
          <div className="text-[10px] text-gray-400">{pct(counts.suspicious)}%</div>
        </div>

        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <div className="text-[11px] text-rose-400 font-medium">High Risk</div>
          <div className="text-xl font-bold text-rose-300 mt-0.5">{counts.highRisk}</div>
          <div className="text-[10px] text-gray-400">{pct(counts.highRisk)}%</div>
        </div>

        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <div className="text-[11px] text-cyan-400 font-medium">Unverified</div>
          <div className="text-xl font-bold text-cyan-300 mt-0.5">{counts.unverified}</div>
          <div className="text-[10px] text-gray-400">{pct(counts.unverified)}%</div>
        </div>
      </div>

      {/* Distribution visual bar */}
      {counts.total > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div style={{ width: `${pct(counts.genuine)}%` }} className="bg-emerald-500 h-full" title="Likely Genuine" />
            <div style={{ width: `${pct(counts.suspicious)}%` }} className="bg-amber-500 h-full" title="Suspicious" />
            <div style={{ width: `${pct(counts.highRisk)}%` }} className="bg-rose-500 h-full" title="High Risk" />
            <div style={{ width: `${pct(counts.unverified)}%` }} className="bg-cyan-500/50 h-full" title="Unverified" />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{counts.total} total verifications</span>
            <span>{counts.unverified} unverified</span>
          </div>
        </div>
      )}
    </div>
  );
}
