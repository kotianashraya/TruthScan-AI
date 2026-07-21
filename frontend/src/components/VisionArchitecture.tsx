import React, { useState } from 'react';
import { 
  Camera, Cpu, FileText, Database, ShieldCheck, Microscope, 
  ArrowRight, Sparkles, Check, Server, Terminal, Layers
} from 'lucide-react';

interface PipelineNode {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  shortDesc: string;
  modelDetails: {
    title: string;
    sub: string;
    techStack: string;
    description: string;
    parameters: { label: string; value: string }[];
  };
}

const NODES: PipelineNode[] = [
  {
    id: 'capture',
    label: 'Camera Capture',
    icon: Camera,
    shortDesc: 'Multi-angle optical macro feed integration.',
    modelDetails: {
      title: 'Macro Frame Grabber Engine',
      sub: 'Module TS-01-CAP',
      techStack: 'H.265 / WebRTC Stream / Raw RGB Frame Buffer',
      description: 'Establishes high-resolution 4K video frame pipeline, executing local geometric auto-cropping, brightness/luminosity balancing, and lens distortion correction algorithms in sub-10ms response times.',
      parameters: [
        { label: 'Minimum Resolution', value: '1920x1080 raw' },
        { label: 'Ingress Latency', value: '6.4 milliseconds' },
        { label: 'Spectral Channels', value: 'RGB / UV-Fluorescence Map' }
      ]
    }
  },
  {
    id: 'mesh',
    label: 'Computer Vision Mesh',
    icon: Cpu,
    shortDesc: 'Packaging 3D orientation & spatial vector mapping.',
    modelDetails: {
      title: '3D Spatial Tensor Mesh Model',
      sub: 'Module TS-02-MESH',
      techStack: 'YOLOv8 / MobileNet-V3 fine-tuned on 10M+ packages',
      description: 'Generates real-time 3D bounding point clouds mapping precise bottle boundaries, cap alignment offsets, material curve angles, and packaging warp coefficients.',
      parameters: [
        { label: 'Mesh Node Density', value: '1,024 polygon anchor points' },
        { label: 'Model Weight Size', value: '84.2 Million parameters' },
        { label: 'Classification Margin', value: '99.94% confidence' }
      ]
    }
  },
  {
    id: 'ocr',
    label: 'OCR Engine',
    icon: Microscope,
    shortDesc: 'Sub-pixel text, font & kerning matching.',
    modelDetails: {
      title: 'Sub-Pixel OCR Label Matcher',
      sub: 'Module TS-03-OCR',
      techStack: 'Transformer-based LayoutLM / PaddleOCR customized',
      description: 'Decodes fine brand lettering, typographic kerning offsets down to 0.1px, batch codes, expiration layouts, and brand logo vector alignment against original CAD blueprint schemas.',
      parameters: [
        { label: 'Kerning Precision', value: '0.08 millimeter resolution' },
        { label: 'Font Verification', value: '12,500 active brand glyphs' },
        { label: 'Batch Match Speed', value: '45 milliseconds' }
      ]
    }
  },
  {
    id: 'reflectivity',
    label: 'Reflectivity Model',
    icon: Sparkles,
    shortDesc: 'Spectral gloss, density & packaging material check.',
    modelDetails: {
      title: 'Packaging Material Reflectivity Model',
      sub: 'Module TS-04-MAT',
      techStack: 'PyTorch Custom Neural Radiance Shader (NeRF)',
      description: 'Validates authenticity of container surface (glass, premium acrylic, or customized PCR plastics) through real-time ambient occlusion refraction matching and holographic layer interference modeling.',
      parameters: [
        { label: 'Specular Deviation Tolerance', value: '< 2.5% variance' },
        { label: 'Hologram Pattern Check', value: 'Phase-contrast spatial mapping' },
        { label: 'Density Estimation', value: 'Refractive index validation (1.52 glass standard)' }
      ]
    }
  },
  {
    id: 'ledger',
    label: 'Anti-Counterfeit Ledger',
    icon: Database,
    shortDesc: 'Distributed validation against global product registries.',
    modelDetails: {
      title: 'Global Cryptographic Anti-Counterfeit Ledger',
      sub: 'Module TS-05-LEDG',
      techStack: 'gRPC Secure Microservices / Distributed Hash Ledger',
      description: 'References extracted batch IDs, barcode indexes, and molecular print signatures in a secure global network, detecting multiple-scans reuse fraud (same package scanned in different cities within hours).',
      parameters: [
        { label: 'Registry DB Coverage', value: '4.2 Billion serial hashes' },
        { label: 'Query Latency', value: '88ms globally' },
        { label: 'Sync Rate', value: 'Real-time multi-region sync' }
      ]
    }
  },
  {
    id: 'report',
    label: 'Explainable AI Report',
    icon: FileText,
    shortDesc: 'Comprehensive, interactive authenticity metrics.',
    modelDetails: {
      title: 'Explainable AI Attribution Report',
      sub: 'Module TS-06-REPT',
      techStack: 'SHAP (SHapley Additive exPlanations) / GPT-Agent Synthesis',
      description: 'Generates structured client/enterprise verification score sheets detailing exact weights of why an item was approved or flagged, backed by localized raw crop coordinate references.',
      parameters: [
        { label: 'Output Format', value: 'Secure JSON-signed PDF / Share Link' },
        { label: 'Trust Metrics', value: 'Individual feature confidence scores' },
        { label: 'Traceability Index', value: 'SHA-256 report verification' }
      ]
    }
  }
];

export default function VisionArchitecture() {
  const [selectedNode, setSelectedNode] = useState<PipelineNode>(NODES[1]); // Mesh by default

  return (
    <div className="max-w-7xl mx-auto px-4 text-white" id="architecture-section">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-brand-violet font-mono mb-3">
          <Server className="w-3.5 h-3.5" /> SECURE AI PIPELINE
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          Computer Vision Neural Pipeline
        </h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
          Our sub-second verification process flows through six highly parallelized deep learning microservices optimized for luxury packaging.
        </p>
      </div>

      {/* PIPELINE GRID / MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PIPELINE CONNECTIONS (LEFT) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl bg-slate-950/40 border border-white/5 p-6 backdrop-blur-xl">
            
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />

            <div className="relative space-y-4">
              {NODES.map((node, idx) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;
                
                return (
                  <div key={node.id} className="relative">
                    {/* Horizontal Connector Line Line drawing between items */}
                    {idx < NODES.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-brand-cyan/60 to-brand-violet/40 z-0 pointer-events-none" />
                    )}

                    <button
                      onClick={() => setSelectedNode(node)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition duration-300 relative z-10 cursor-pointer ${
                        isSelected 
                          ? 'border-brand-cyan bg-brand-cyan/10 glow-cyan' 
                          : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {/* Node Index Badge */}
                      <span className="text-xs font-mono text-gray-500 font-bold shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-brand-cyan text-gray-900' : 'bg-white/5 text-brand-cyan'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Labels */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                          {node.label}
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping shrink-0" />
                          )}
                        </h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {node.shortDesc}
                        </p>
                      </div>

                      {/* Direction arrow */}
                      <ArrowRight className={`w-4 h-4 transition-transform shrink-0 ${
                        isSelected ? 'text-brand-cyan translate-x-1' : 'text-gray-600'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* DETAILS PANEL - Glass Drawer (RIGHT) */}
        <div className="lg:col-span-5 h-full">
          <div className="rounded-2xl glass-panel p-6 border border-white/10 relative h-full flex flex-col min-h-[420px] overflow-hidden">
            {/* Holographic glowing element */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

            {/* Title / Module Badge */}
            <div className="mb-6 relative z-10">
              <div className="flex items-center gap-2 text-[10px] font-mono text-brand-cyan bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md w-fit mb-3">
                <Terminal className="w-3.5 h-3.5" /> {selectedNode.modelDetails.sub}
              </div>
              <h3 className="text-xl font-display font-semibold text-white">
                {selectedNode.modelDetails.title}
              </h3>
              <p className="text-xs font-mono text-brand-violet mt-1 font-medium">
                Engine: {selectedNode.modelDetails.techStack}
              </p>
            </div>

            {/* Description */}
            <div className="text-sm text-gray-300 leading-relaxed flex-1 mb-6 relative z-10 bg-black/20 p-4 rounded-xl border border-white/5">
              {selectedNode.modelDetails.description}
            </div>

            {/* Model Parameters List */}
            <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-brand-cyan" /> Target Performance Benchmarks
              </div>
              {selectedNode.modelDetails.parameters.map((param, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                  <span className="text-gray-400">{param.label}</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-brand-emerald" /> {param.value}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
