import { CheckCircle2, Circle, Clock, Milestone, Sparkles } from 'lucide-react';

interface MilestoneItem {
  quarter: string;
  title: string;
  status: 'Live' | 'In Testing' | 'Upcoming';
  description: string;
  features: string[];
}

const MILESTONES: MilestoneItem[] = [
  {
    quarter: 'Q1 2026',
    title: 'Core Neural Models & SDK Launch',
    status: 'Live',
    description: 'Release of YOLOv8 luxury-skincare fine-tuned modules and client-side optical macro stream capture interfaces.',
    features: ['High-contrast auto-cropping SDK', 'Cosmetics container model fine-tune', 'Durable Firestore database logs']
  },
  {
    quarter: 'Q3 2026',
    title: 'Holographic & Specular Refraction Engine',
    status: 'In Testing',
    description: 'Active spectral glass refraction and polymer density calculations using deep learning phase-contrast neural shaders.',
    features: ['Holographic seals phase matcher', 'Refractive index check logic', 'Dual-use ledger query optimizations']
  },
  {
    quarter: 'Q1 2027',
    title: 'Enterprise ERP & Webhook Integrations',
    status: 'Upcoming',
    description: 'Connecting verification alerts directly to supply-chain ledgers, Shopify checkout webhooks, and brand ERP inventory systems.',
    features: ['Direct gRPC brand pipelines', 'Automatic counterfeit warehouse flagging', 'Developer API portal launch']
  },
  {
    quarter: 'Q4 2027',
    title: 'TruthScan Decentralized Trust Ledger',
    status: 'Upcoming',
    description: 'Consolidating anti-counterfeit logs onto high-velocity distributed cryptographic registers for cross-continent tracking.',
    features: ['Consensus batch-code ledger', 'Zero-Knowledge report sharing', 'Decentralized packaging verification nodes']
  }
];

export default function Roadmap() {
  return (
    <div className="max-w-5xl mx-auto px-4 text-white" id="roadmap-section">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-brand-violet font-mono mb-3">
          <Milestone className="w-3.5 h-3.5" /> DEVELOPMENT ROADMAP
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          Enterprise Integration & Vision Roadmap
        </h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
          Our structured, long-term timeline mapping deep learning milestones from 2026 models to global decentralized ledgers.
        </p>
      </div>

      {/* Vertical timeline representation */}
      <div className="relative border-l-2 border-white/10 ml-4 md:ml-32 pl-8 md:pl-16 space-y-12">
        {MILESTONES.map((item, idx) => {
          const isLive = item.status === 'Live';
          const isTesting = item.status === 'In Testing';
          
          return (
            <div key={idx} className="relative group">
              {/* Timeline Marker Point */}
              <div className="absolute -left-[41px] md:-left-[73px] top-1.5 flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isLive 
                    ? 'bg-emerald-400/25 border-emerald-400 text-emerald-400 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : isTesting 
                    ? 'bg-brand-cyan/25 border-brand-cyan text-brand-cyan scale-105 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950 border-white/20 text-gray-500'
                }`}>
                  {isLive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : isTesting ? (
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 shrink-0" />
                  )}
                </div>
              </div>

              {/* Hover dynamic background highlights */}
              <div className="absolute -inset-y-4 -inset-x-6 rounded-2xl bg-white/[0.01] border border-transparent group-hover:bg-white/[0.03] group-hover:border-white/5 transition-all duration-300 pointer-events-none" />

              {/* Left timeline label block (visible on desktop) */}
              <div className="hidden md:block absolute right-full mr-12 text-right top-1 text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">
                {item.quarter}
              </div>

              {/* Content Box */}
              <div className="relative">
                {/* Mobile visible label */}
                <div className="md:hidden text-xs font-mono font-bold text-brand-cyan uppercase tracking-widest mb-1">
                  {item.quarter}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-display font-semibold text-white group-hover:text-brand-cyan transition duration-300">
                    {item.title}
                  </h3>
                  
                  {/* Status pills */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isLive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : isTesting 
                      ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' 
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                  {item.description}
                </p>

                {/* Sub features checklist */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.features.map((feat, fIdx) => (
                    <span 
                      key={fIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 font-medium group-hover:border-white/10 transition duration-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-violet" /> {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
