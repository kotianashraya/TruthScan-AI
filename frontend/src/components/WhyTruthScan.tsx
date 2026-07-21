import { ShieldX, ShieldCheck, Zap, HeartCrack, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function WhyTruthScan() {
  return (
    <div className="max-w-7xl mx-auto px-4 text-white" id="features-section">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-brand-cyan font-mono mb-3">
          <Zap className="w-3.5 h-3.5" /> COMPETITIVE DOMINANCE
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          Next-Gen AI Authenticity Paradigm
        </h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
          A definitive side-by-side comparison of old-world manual authentication protocols versus our real-time deep learning neural matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TRADITIONAL COLUMN */}
        <div className="rounded-2xl bg-slate-950/20 border border-red-500/10 p-8 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/20 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
              <ShieldX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display">Traditional Verification</h3>
              <p className="text-xs text-gray-400">Manual spot checks & static serialization</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <Clock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Extremely Slow Latency</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Requires manual lab audits, custom barcode scanner logistics, or physical shipping of suspicious items. Turnaround times typically take 5-14 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Limited Structural Accuracy</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Average accuracy rates hover at ~64%. Sophisticated counterfeit operations easily reproduce barcodes, dual-use serials, and outer packaging prints.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <HeartCrack className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">No Spatial Reflection Tracking</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Traditional scanners only read flat 1D/2D barcode blocks, completely ignoring package plastic grade, glass wall variances, and holographic layer anomalies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TRUTHSCAN COLUMN */}
        <div className="rounded-2xl bg-brand-cyan/5 border border-brand-cyan/20 p-8 backdrop-blur-xl relative overflow-hidden group hover:border-brand-cyan/30 transition duration-300 glow-cyan">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-cyan text-gray-900 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display text-white">TruthScan Neural Matrix</h3>
              <p className="text-xs text-brand-cyan font-mono">Instant optical macro analysis</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Zap className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Instant 0.4s Verification</h4>
                <p className="text-xs text-cyan-100/75 mt-1">
                  Fully server-side optimized YOLOv8 and LayoutLM pipelines render comprehensive authenticity decisions directly to client devices in less than half a second.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">99.8% Certified Precision</h4>
                <p className="text-xs text-cyan-100/75 mt-1">
                  Trained on multi-million high-fidelity packaging datasets covering major global beauty, luxury cosmetics, skincare, and high-fashion luxury lines.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Sparkles className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">3D Hologram Phase & Refraction Modeling</h4>
                <p className="text-xs text-cyan-100/75 mt-1">
                  Actively evaluates glass refraction index, premium plastic polymer density coefficients, micro-typography kerning, and dual-use registry histories.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
