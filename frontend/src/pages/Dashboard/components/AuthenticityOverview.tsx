import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function AuthenticityOverview() {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({ authentic: 0, suspicious: 0, counterfeit: 0 });

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const q = query(collection(db, 'scans'), where('uid', '==', currentUser.uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data() as any);
        setCounts({
          authentic: docs.filter(d => d.result === 'authentic').length,
          suspicious: docs.filter(d => d.result === 'suspicious').length,
          counterfeit: docs.filter(d => d.result === 'counterfeit').length,
        });
      } catch (e) {
        setCounts({ authentic: 0, suspicious: 0, counterfeit: 0 });
      }
    };
    void load();
  }, [currentUser]);

  return (
    <div className="p-4 bg-white/3 rounded-lg">
      <h3 className="font-semibold">Authenticity Overview</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-white/5 rounded">
          <div className="text-sm text-gray-300">Authentic</div>
          <div className="text-xl font-semibold">{counts.authentic}</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded">
          <div className="text-sm text-gray-300">Suspicious</div>
          <div className="text-xl font-semibold">{counts.suspicious}</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded">
          <div className="text-sm text-gray-300">Counterfeit</div>
          <div className="text-xl font-semibold">{counts.counterfeit}</div>
        </div>
      </div>
    </div>
  );
}
