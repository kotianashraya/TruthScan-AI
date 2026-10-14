import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserScans } from '@/services/scanService';

export default function StatsCards() {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [genuine, setGenuine] = useState(0);
  const [suspicious, setSuspicious] = useState(0);
  const [highRisk, setHighRisk] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const docs = await getUserScans(currentUser.uid);
        let gen = 0;
        let susp = 0;
        let risk = 0;

        docs.forEach(doc => {
          const r = doc.riskLevel || doc.authenticity?.riskLevel;
          const score = doc.authenticityScore ?? doc.authenticity?.authenticityScore;

          if (r === 'LIKELY_GENUINE' || (score != null && score >= 75)) gen++;
          else if (r === 'SUSPICIOUS' || (score != null && score >= 45)) susp++;
          else if (r === 'HIGH_RISK' || (score != null && score > 0)) risk++;
        });

        setTotal(docs.length);
        setGenuine(gen);
        setSuspicious(susp);
        setHighRisk(risk);
      } catch (e) {
        setTotal(0);
        setGenuine(0);
        setSuspicious(0);
        setHighRisk(0);
      }
    };
    void load();
  }, [currentUser]);

  const Card = ({ label, value, colorClass }: { label: string; value: number; colorClass?: string }) => (
    <div className="bg-white/3 p-4 rounded-xl border border-white/10">
      <div className="text-xs text-gray-400 font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 ${colorClass || 'text-white'}`}>{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card label="Total Scans" value={total} colorClass="text-cyan-400" />
      <Card label="Likely Genuine" value={genuine} colorClass="text-emerald-400" />
      <Card label="Suspicious Products" value={suspicious} colorClass="text-amber-400" />
      <Card label="High Risk Flags" value={highRisk} colorClass="text-rose-400" />
    </div>
  );
}
