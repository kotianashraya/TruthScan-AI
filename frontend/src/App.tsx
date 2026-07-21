import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, ChevronRight, Play, Check, 
  Layers, Lock, ExternalLink, Globe, HelpCircle, ArrowUpRight
} from 'lucide-react';
import AICoreSphere from './components/AICoreSphere';
import LiveScanner from './components/LiveScanner';
import VisionArchitecture from './components/VisionArchitecture';
import WhyTruthScan from './components/WhyTruthScan';
import Roadmap from './components/Roadmap';
import WaitlistModal from './components/WaitlistModal';

export default function App() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [heroAuthenticityScore, setHeroAuthenticityScore] = useState(0);

  // Ramp up hero authenticity counter from 0% to 99.8%
  useEffect(() => {
    let current = 0;
    const target = 99.8;
    const increment = 1.2;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setHeroAuthenticityScore(target);
        clearInterval(timer);
      } else {
        setHeroAuthenticityScore(parseFloat(current.toFixed(1)));
      }
    }, 25);

    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-brand-cyan selection:text-gray-900 relative overflow-x-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />

      {/* FLOATING GLASS ISLAND NAVIGATION BAR */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl rounded-full glass-panel border border-white/10 px-6 py-3 flex items-center justify-between shadow-2xl backdrop-blur-md">
        {/* Glowing Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="font-display font-black text-sm text-gray-950">TS</span>
          </div>
          <span className="font-display font-bold tracking-tight text-lg text-white">
            TruthScan <span className="text-brand-cyan text-xs font-mono font-bold uppercase ml-1">AI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button onClick={() => scrollToSection('features-section')} className="text-gray-400 hover:text-white transition cursor-pointer">Features</button>
          <button onClick={() => scrollToSection('live-demo-section')} className="text-gray-400 hover:text-white transition cursor-pointer">Live Demo</button>
          <button onClick={() => scrollToSection('architecture-section')} className="text-gray-400 hover:text-white transition cursor-pointer">Architecture</button>
          <button onClick={() => scrollToSection('roadmap-section')} className="text-gray-400 hover:text-white transition cursor-pointer">Roadmap</button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => scrollToSection('live-demo-section')}
            className="hidden sm:inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-semibold cursor-pointer transition"
          >
            Launch Live Scan
          </button>
          <button 
            onClick={() => setIsWaitlistOpen(true)}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition transform hover:scale-[1.03]"
          >
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-brand-cyan font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" /> SECURING COSMETIC & LUXURY RETAIL
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">
            Scan. Verify.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-violet">Trust.</span>
          </h1>

          <p className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed">
            AI-powered real-time authenticity verification for skincare, beauty, and luxury products. Safeguard cosmetics integrity in sub-seconds.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => scrollToSection('live-demo-section')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-violet hover:from-cyan-400 hover:to-violet-500 text-gray-900 font-semibold text-sm flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/25"
            >
              Try Live Demo <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('architecture-section')}
              className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white font-medium text-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Play className="w-3.5 h-3.5" /> Watch Vision Architecture
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
            <div>
              <span className="block text-2xl font-bold font-mono text-white">0.4s</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase">Scan Speed</span>
            </div>
            <div>
              <span className="block text-2xl font-bold font-mono text-white">99.8%</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase">Decision Precision</span>
            </div>
            <div>
              <span className="block text-2xl font-bold font-mono text-white">10M+</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase">Dataset Scale</span>
            </div>
          </div>
        </div>

        {/* Hero Right: 3D Sphere & Floating Animated Scan Card */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          
          {/* Interactive Core sphere (reacts to mouse movement) */}
          <div className="w-full max-w-[440px] aspect-square relative z-0">
            <AICoreSphere />
          </div>

          {/* Floating Laser Scanning Simulation Card */}
          <div className="absolute bottom-[-10px] right-2 md:right-10 w-[240px] sm:w-[280px] rounded-xl glass-panel p-4 border border-white/15 shadow-2xl z-20 glow-cyan animate-pulse" style={{ animationDuration: '4s' }}>
            <div className="relative aspect-square rounded-lg bg-black/40 overflow-hidden mb-3 border border-white/5">
              
              {/* Simulated laser line moving */}
              <div className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-laser z-10" />
              
              {/* Cosmetic Serum Bottle Blueprint/Vector overlay */}
              <div className="w-full h-full flex items-center justify-center relative p-6">
                {/* SVG Skincare Bottle Render */}
                <svg viewBox="0 0 100 150" className="w-16 h-28 text-cyan-500/20 fill-none stroke-current" strokeWidth="1.5">
                  <path d="M40,30 L60,30 L60,40 L40,40 Z" className="text-brand-cyan" />
                  <path d="M48,15 L52,15 L52,30 L48,30 Z" className="text-brand-violet" />
                  <rect x="25" y="40" width="50" height="90" rx="12" />
                  <line x1="30" y1="65" x2="70" y2="65" strokeDasharray="3,3" />
                  <line x1="30" y1="90" x2="70" y2="90" strokeDasharray="3,3" />
                </svg>
                
                {/* Bounding box highlights */}
                <div className="absolute border border-brand-cyan/60 bg-cyan-500/5 left-[25%] top-[42%] w-[50%] h-[18%] flex flex-col justify-between">
                  <span className="bg-brand-cyan text-gray-950 font-mono text-[7px] font-bold px-0.5 self-start scale-90">Logo Match</span>
                </div>
                <div className="absolute border border-brand-violet/60 bg-violet-500/5 left-[35%] top-[70%] w-[30%] h-[12%] flex flex-col justify-between">
                  <span className="bg-brand-violet text-white font-mono text-[7px] font-bold px-0.5 self-start scale-90">Batch #8F2026</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Scan results */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span>INDEXING CORE</span>
                <span className="text-brand-cyan">LEDGER SYNC</span>
              </div>
              <h4 className="font-semibold text-white">Advanced Molecular Serum</h4>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-brand-emerald font-mono font-bold">GENUINE</span>
                <span className="text-white font-mono font-bold text-sm tracking-tight">
                  {heroAuthenticityScore}%
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* WHY TRUTHSCAN / FEATURE MATRIX */}
      <section className="py-20 border-t border-white/5 bg-slate-950/20">
        <WhyTruthScan />
      </section>

      {/* INTERACTIVE SCANNER LIVE DEMO */}
      <section className="py-20 border-t border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-brand-cyan font-mono mb-3">
            <Layers className="w-3.5 h-3.5" /> SECURE SANDBOX
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
            Interactive Verification Demo
          </h2>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
            Simulate a computer vision authentication sequence. Choose one of our pre-loaded samples or upload an image to save a report to Firestore.
          </p>
        </div>
        
        <LiveScanner />
      </section>

      {/* COMPUTER VISION ARCHITECTURE PIPELINE */}
      <section className="py-20 border-t border-white/5 bg-slate-950/20">
        <VisionArchitecture />
      </section>

      {/* DEVELOPMENT ROADMAP TIMELINE */}
      <section className="py-20 border-t border-white/5">
        <Roadmap />
      </section>

      {/* FOOTER & FINAL CTA PANEL */}
      <footer className="border-t border-white/10 bg-black/40 py-16 relative">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-cyan-500/25 mx-auto">
            <span className="font-display font-black text-lg text-gray-950">TS</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            Ready to Protect Your Brand Integrity?
          </h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Deploy TruthScan AI sub-second verification pipelines into your supply-chain, retail checkout, or mobile customer experiences.
          </p>

          <div>
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-bold text-sm shadow-xl shadow-cyan-500/25 cursor-pointer transition transform hover:scale-[1.03]"
            >
              Secure Priority Onboarding Waitlist
            </button>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-cyan" />
              <span>TruthScan AI Inc. © 2026. All rights reserved.</span>
            </div>

            <div className="flex gap-6">
              <span className="hover:text-white transition cursor-pointer">Security Standards</span>
              <span className="hover:text-white transition cursor-pointer">Terms of Operation</span>
              <span className="hover:text-white transition cursor-pointer">Privacy Matrix</span>
            </div>
          </div>
        </div>
      </footer>

      {/* WAITLIST CAPTURE MODAL */}
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />

    </div>
  );
}
