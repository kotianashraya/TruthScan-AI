import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Sliders,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserScans } from '@/services/scanService';

interface AppSettings {
  preferredCamera: 'environment' | 'user';
  autoSaveScans: boolean;
  highContrastOcr: boolean;
  multiPassBarcode: boolean;
  soundFeedback: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  preferredCamera: 'environment',
  autoSaveScans: true,
  highContrastOcr: true,
  multiPassBarcode: true,
  soundFeedback: false,
};

const STORAGE_KEY = 'truthscan_app_settings';

export default function SettingsPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedBanner, setSavedBanner] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearedBanner, setClearedBanner] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch (e) {
      console.warn('[SETTINGS] localStorage write failed', e);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleExportAllScans = async () => {
    if (!currentUser) return;
    setExporting(true);
    try {
      const allScans = await getUserScans(currentUser.uid);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allScans, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `truthscan-all-scans-export-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('[SETTINGS] export failed', err);
      alert('Could not export scan data. Please check network connection.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearCache = () => {
    if (!confirm('This will reset your local preferences and image caches. Continue?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setClearedBanner(true);
    setTimeout(() => setClearedBanner(false), 3000);
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Preferences & Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Configure optical scanner behavior, automated persistence, and privacy controls.</p>
          </div>
          {savedBanner && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved
            </span>
          )}
        </div>

        {clearedBanner && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Local preferences and temporary caches have been cleared.
          </div>
        )}

        {/* Scanner Hardware & Detection Preferences */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            Scanner & Optics Preferences
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-white">Default Camera Lens</div>
                <div className="text-xs text-gray-400">Select the preferred physical camera sensor for packaging scans.</div>
              </div>
              <select
                value={settings.preferredCamera}
                onChange={(e) => updateSetting('preferredCamera', e.target.value as 'environment' | 'user')}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="environment" className="bg-gray-900">Rear Camera (Recommended)</option>
                <option value="user" className="bg-gray-900">Front / Selfie Camera</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5">
              <div>
                <div className="font-medium text-white">High-Contrast OCR Preprocessing</div>
                <div className="text-xs text-gray-400">Apply adaptive luminance curves and contrast filtering before Tesseract OCR.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrastOcr}
                onChange={(e) => updateSetting('highContrastOcr', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5">
              <div>
                <div className="font-medium text-white">Multi-Pass Barcode Decoding</div>
                <div className="text-xs text-gray-400">Perform multi-scale region crops when 1D barcodes are not detected in the first pass.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.multiPassBarcode}
                onChange={(e) => updateSetting('multiPassBarcode', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Persistence & Automation */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-blue" />
            Persistence & Automation
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-white">Automatic Scan History Persistence</div>
                <div className="text-xs text-gray-400">Automatically save successful product analyses to your authenticated account.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSaveScans}
                onChange={(e) => updateSetting('autoSaveScans', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Privacy & Data Management */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Data Ownership & Privacy
          </h2>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-white/2 rounded-xl border border-white/5">
              <div>
                <div className="text-sm font-semibold text-white">Export All Scan Records</div>
                <div className="text-xs text-gray-400 mt-0.5">Download a complete, machine-readable JSON archive of all your verification scans.</div>
              </div>
              <button
                onClick={() => void handleExportAllScans()}
                disabled={exporting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold flex items-center gap-1.5 transition self-start sm:self-auto disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Preparing Archive...' : 'Export JSON'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/15">
              <div>
                <div className="text-sm font-semibold text-white">Clear Local Cache & Reset</div>
                <div className="text-xs text-gray-400 mt-0.5">Reset preferences to defaults and clear cached optical tokens.</div>
              </div>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Cache
              </button>
            </div>
          </div>
        </div>

        {/* Product Overview & Architecture Exploration */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-brand-cyan" />
            Product Overview & Platform Architecture
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/2 rounded-xl border border-white/5">
            <div>
              <div className="text-sm font-semibold text-white">View Public Overview</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Explore the complete TruthScan AI long-form presentation, interactive sandbox, and vision architecture timeline without modifying your default login routing.
              </div>
            </div>
            <Link
              to="/overview"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shadow-md shadow-cyan-500/20"
            >
              <span>Product Overview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Account & Sign-in Management */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-blue" />
            Account & Sign-in Management
          </h2>
          <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Active Session</div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">{currentUser?.email || 'Authenticated user'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition"
                >
                  Manage Profile
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate('/login', { replace: true });
                    } catch (err) {
                      console.error('[SETTINGS] sign out error', err);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 pt-1 border-t border-white/5">
              To switch accounts: Click Sign Out and log in with your alternate credentials.
            </div>
          </div>
        </div>

        {/* Reset to defaults button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Factory Defaults
          </button>
        </div>
      </div>
    </main>
  );
}
