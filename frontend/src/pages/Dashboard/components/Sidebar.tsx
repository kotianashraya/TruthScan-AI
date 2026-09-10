import { LogOut, Home, Search, FileText, User, Settings2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-72 bg-[#07101a]/60 text-white h-screen p-4 hidden md:flex flex-col justify-between">
      <div>
        <div className="mb-8 px-2">
          <h2 className="font-display text-xl text-brand-cyan">TruthScan AI</h2>
          <p className="text-xs text-gray-400 mt-1">Product Authenticity Platform</p>
        </div>

        <nav className="space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <Home className="w-4 h-4 text-cyan-400" /> <span>Dashboard</span>
          </Link>
          <Link to="/scanner" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <Search className="w-4 h-4 text-cyan-400" /> <span>Scan Product</span>
          </Link>
          <Link to="/history" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <FileText className="w-4 h-4 text-cyan-400" /> <span>Scan History</span>
          </Link>
          <Link to="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <FileText className="w-4 h-4 text-cyan-400" /> <span>Reports</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <User className="w-4 h-4 text-cyan-400" /> <span>Profile</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <Settings2 className="w-4 h-4 text-cyan-400" /> <span>Settings</span>
          </Link>
        </nav>
      </div>

      <div className="px-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">{currentUser?.displayName?.charAt(0) ?? '?'}</div>
          <div className="flex-1">
            <div className="text-sm">{currentUser?.displayName ?? currentUser?.email}</div>
            <div className="text-xs text-gray-400">{currentUser ? 'Member' : ''}</div>
          </div>
          <button onClick={() => void signOut()} className="text-sm text-red-400">Sign out</button>
        </div>
      </div>
    </aside>
  );
}
