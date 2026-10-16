import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  FileText,
  User,
  Settings2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { currentUser, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[AUTH] sign out error', err);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/scanner', label: 'Scan Product', icon: Search },
    { to: '/history', label: 'Scan History', icon: FileText },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings2 },
  ];

  const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
      isActive
        ? 'bg-cyan-500/15 text-brand-cyan border border-cyan-500/25 shadow-sm shadow-cyan-500/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition ${
      isActive
        ? 'bg-cyan-500/15 text-brand-cyan border border-cyan-500/25'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col md:flex-row print:bg-white print:text-black print:block print:min-h-0">
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-[#07101a]/80 border-r border-white/10 text-white h-screen sticky top-0 p-5 hidden md:flex flex-col justify-between z-30 backdrop-blur-md print:hidden">
        <div>
          {/* Logo Navigation to Authenticated Home (/dashboard) */}
          <Link to="/dashboard" className="flex items-center gap-2 mb-8 px-1 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition">
              <span className="font-display font-black text-sm text-gray-950">TS</span>
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-base text-white">
                TruthScan <span className="text-brand-cyan text-xs font-mono font-bold uppercase ml-0.5">AI</span>
              </span>
              <span className="block text-[10px] text-gray-400 font-mono">AUTHENTICITY SUITE</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                  <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Account / Sign Out */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 border border-cyan-500/40 flex items-center justify-center font-bold text-sm text-cyan-300 shrink-0">
              {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-[10px] text-gray-400 truncate">{currentUser?.email || ''}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER (Phones & Tablets) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#07101a]/95 border-b border-white/10 backdrop-blur-md px-4 py-3 flex items-center justify-between print:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-violet flex items-center justify-center shadow-md shadow-cyan-500/25">
            <span className="font-display font-black text-xs text-gray-950">TS</span>
          </div>
          <span className="font-display font-bold tracking-tight text-base text-white">
            TruthScan <span className="text-brand-cyan text-[10px] font-mono font-bold uppercase ml-0.5">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/scanner"
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center gap-1 shadow-sm shadow-cyan-500/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scan</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white transition"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER / SLIDEOUT MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-30 bg-[#030712]/95 backdrop-blur-lg flex flex-col justify-between p-5 animate-in fade-in duration-150">
          <div className="space-y-4">
            <div className="px-1 text-xs font-mono text-gray-400 uppercase tracking-wider">Navigation</div>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavClass}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-sm text-cyan-300 shrink-0">
                {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                void handleSignOut();
              }}
              className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto print:overflow-visible print:bg-white print:text-black print:p-0 print:m-0">
        {children}
      </main>
    </div>
  );
}
