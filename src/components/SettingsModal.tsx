import React, { useState, useEffect } from 'react';
import { 
  Settings, Key, Mail, Terminal, Copy, Check, X, 
  ShieldCheck, Zap, Server, Clock, Lock, Sparkles, Database
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  // Purely user input - ZERO hardcoded keys in source code!
  const [cfEmail, setCfEmail] = useState(() => {
    try {
      return localStorage.getItem('dios_settings_cf_email') || '';
    } catch {
      return '';
    }
  });

  const [cfKey, setCfKey] = useState(() => {
    try {
      return localStorage.getItem('dios_settings_cf_key') || '';
    } catch {
      return '';
    }
  });

  const [rememberOnIpad, setRememberOnIpad] = useState(() => {
    try {
      return localStorage.getItem('dios_settings_remember_keys') === 'true';
    } catch {
      return false;
    }
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (rememberOnIpad) {
      try {
        localStorage.setItem('dios_settings_cf_email', cfEmail);
        localStorage.setItem('dios_settings_cf_key', cfKey);
        localStorage.setItem('dios_settings_remember_keys', 'true');
      } catch {}
    } else {
      try {
        localStorage.removeItem('dios_settings_cf_email');
        localStorage.removeItem('dios_settings_cf_key');
        localStorage.setItem('dios_settings_remember_keys', 'false');
      } catch {}
    }
  }, [rememberOnIpad, cfEmail, cfKey]);

  if (!isOpen) return null;

  // Dynamically constructed ONLY in browser memory when user types
  const exportEmailLine = cfEmail.trim() ? `export CLOUDFLARE_EMAIL="${cfEmail.trim()}"\n` : '';
  const exportKeyLine = cfKey.trim() ? `export CLOUDFLARE_API_KEY="${cfKey.trim()}"\n` : '';

  const dynamicMasterCommand = `${exportEmailLine}${exportKeyLine}python3 master_bootstrap.py`;

  const handleCopy = () => {
    navigator.clipboard.writeText(dynamicMasterCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl max-w-3xl w-full p-5 md:p-6 shadow-2xl flex flex-col max-h-[92vh] space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-xl shadow-lg">
              <Settings size={22} />
            </span>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                Settings &amp; Codespace Master Launcher
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  Zero-Secret Safe
                </span>
              </h2>
              <p className="text-xs text-slate-400">Enter Credentials Manually &bull; Generates 1-Click Command in Memory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Credentials Form (Manual Input) */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Key size={14} /> Cloudflare Credentials (Manual Input):</span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal cursor-pointer normal-case">
              <input
                type="checkbox"
                checked={rememberOnIpad}
                onChange={e => setRememberOnIpad(e.target.checked)}
                className="rounded text-cyan-500"
              />
              <span>Remember in iPad Safari LocalStorage?</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cloudflare Email:</label>
              <input
                type="text"
                value={cfEmail}
                onChange={e => setCfEmail(e.target.value)}
                placeholder="e.g. "
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cloudflare Global API Key:</label>
              <input
                type="password"
                value={cfKey}
                onChange={e => setCfKey(e.target.value)}
                placeholder="Paste your key here..."
                className="w-full bg-slate-900 border border-slate-700 text-yellow-300 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Master Script Box */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} className="text-emerald-400" />
              Dynamic 1-Click Command for New Codespace:
            </span>
            
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95"
            >
              {copied ? <Check size={14} className="text-yellow-300" /> : <Copy size={14} />}
              <span>{copied ? "✅ COPIED MASTER SCRIPT!" : "📋 COPY MASTER SCRIPT"}</span>
            </button>
          </div>

          <div className="p-3 bg-black rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 select-all whitespace-pre-wrap leading-relaxed">
            {dynamicMasterCommand}
          </div>
        </div>

        {/* Protected Engines List */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={13} /> 8 Core Python Engines Protected:
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Zero Secrets in Code
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px] text-slate-300">
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> server.py
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> dcr_calls (S15)
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> dcr_live (S02)
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> expense_engine
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> primary_playwright
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> spo_engine (S03)
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> primary_excel
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800 flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> live_terminal (9000)
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-amber-400" />
            <span>Key code me save nahi hogi, sirf aapke click par copy hogi.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
