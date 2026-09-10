import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button onClick={() => navigate('/scanner')} className="px-4 py-3 rounded-lg bg-cyan-500 text-black font-semibold">Scan Product</button>
      <button onClick={() => navigate('/scanner')} className="px-4 py-3 rounded-lg bg-white/5 border border-white/5">Upload Product Image</button>
      <button onClick={() => navigate('/history')} className="px-4 py-3 rounded-lg bg-white/5 border border-white/5">View Scan History</button>
    </div>
  );
}
