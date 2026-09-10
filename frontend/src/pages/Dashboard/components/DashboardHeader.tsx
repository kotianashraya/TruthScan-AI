import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardHeader({ title = 'Dashboard' }: { title?: string }) {
  const { currentUser } = useAuth();
  return (
    <header className="flex items-center justify-between py-4">
      <div>
        <h1 className="text-2xl font-display font-semibold">{title}</h1>
        <p className="text-sm text-gray-400">Welcome back, {currentUser?.displayName ?? currentUser?.email?.split('@')[0]}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/8"><Bell className="w-5 h-5 text-cyan-300" /></button>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">{currentUser?.displayName?.charAt(0) ?? '?'}</div>
      </div>
    </header>
  );
}
