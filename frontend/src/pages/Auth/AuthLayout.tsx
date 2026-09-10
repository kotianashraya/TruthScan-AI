import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#030712] text-white font-sans relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06),transparent_60%)] pointer-events-none" />
      <section className="relative w-full max-w-md rounded-2xl glass-panel border border-white/10 p-7 sm:p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-white mb-8 group">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="font-display font-black text-sm text-gray-950">TS</span>
          </span>
          <span className="font-display font-bold tracking-tight text-lg">TruthScan <span className="text-brand-cyan text-xs font-mono font-bold uppercase ml-1">AI</span></span>
        </Link>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-brand-cyan font-mono mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE ACCESS
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
