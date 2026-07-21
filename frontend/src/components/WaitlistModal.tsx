import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { X, Check, ArrowRight, Loader2, Award, Users, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Brand'); // Brand, Retailer, Consumer
  const [volume, setVolume] = useState('1k-10k scans/mo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [queueNumber, setQueueNumber] = useState(1342);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      // 1. Fetch current waitlist count to compute official queue number
      const snapshot = await getDocs(collection(db, 'waitlist_leads'));
      const count = snapshot.size;
      const newQueueNum = 428 + count;
      setQueueNumber(newQueueNum);

      // 2. Add doc to Firestore
      await addDoc(collection(db, 'waitlist_leads'), {
        name,
        email,
        role,
        volume,
        createdAt: new Date().toISOString(),
        queueNumber: newQueueNum
      });

      // 3. Trigger confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#10b981']
      });

      setIsSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Firestore write failed:", err);
      setError('System connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel p-8 text-white shadow-2xl transition-all duration-300 transform scale-100 border border-white/10 glow-cyan">
        
        {/* Futuristic Laser Border Highlight */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-blue" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
          id="close-waitlist-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-brand-cyan font-mono mb-3">
                <Users className="w-3.5 h-3.5" /> SECURE GATEWAY OPEN
              </div>
              <h3 className="text-2xl font-display font-semibold tracking-tight">
                Secure TruthScan Enterprise Access
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Join our 2026 early access cohort for computer-vision authentication.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sophia Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.vance@luxurybrand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none text-sm transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Organization Type
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-white/10 focus:border-brand-cyan outline-none text-sm transition text-white"
                  >
                    <option value="Brand">Luxury Brand Owner</option>
                    <option value="Retailer">Luxury Retailer / Distributor</option>
                    <option value="Consumer">Enterprise Investor / Consumer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Monthly Scan Volume
                  </label>
                  <select
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-white/10 focus:border-brand-cyan outline-none text-sm transition text-white"
                  >
                    <option value="Under 1k">Under 1,000 / mo</option>
                    <option value="1k-10k scans/mo">1,000 - 10,000 / mo</option>
                    <option value="10k-100k scans/mo">10,000 - 100,000 / mo</option>
                    <option value="100k+ scans/mo">100,000+ / mo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  id="submit-waitlist-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisioning Entry...
                    </>
                  ) : (
                    <>
                      Initialize Priority Reservation <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-green">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h3 className="text-2xl font-display font-semibold text-white mb-2">
              Registration Authorized
            </h3>
            <p className="text-sm text-gray-300 max-w-sm mx-auto mb-6">
              Welcome to the cohort, <span className="text-brand-cyan font-medium">{name}</span>. Your authentication portal has been secured.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 max-w-sm mx-auto">
              <div className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1">
                Your Priority Queue Position
              </div>
              <div className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-violet">
                #{queueNumber}
              </div>
              <div className="text-[10px] text-brand-emerald font-mono mt-1 flex items-center justify-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> GUARANTEED 2026 VIP COHORT
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
              id="success-dismiss-btn"
            >
              Enter Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
