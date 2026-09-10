import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function StatsCards() {
  const { currentUser } = useAuth();
  const [total, setTotal] = useState(0);
  const [authentic, setAuthentic] = useState(0);
  const [suspicious, setSuspicious] = useState(0);
  const [counterfeit, setCounterfeit] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const q = query(collection(db, 'scans'), where('uid', '==', currentUser.uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setTotal(docs.length);
        setAuthentic(docs.filter(d => d.result === 'authentic').length);
        setSuspicious(docs.filter(d => d.result === 'suspicious').length);
        setCounterfeit(docs.filter(d => d.result === 'counterfeit').length);
      } catch (e) {
        setTotal(0);
        setAuthentic(0);
        setSuspicious(0);
        setCounterfeit(0);
      }
    };
    void load();
  }, [currentUser]);

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-white/3 p-4 rounded-lg">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card label="Total Scans" value={total} />
      <Card label="Authentic Products" value={authentic} />
      <Card label="Suspicious Products" value={suspicious} />
      <Card label="Counterfeit Detected" value={counterfeit} />
    </div>
  );
}
