import os, subprocess

file_path = 'src/components/SettingsModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Clean replacement for SettingsModal with 1-Click Server Start Command
new_settings_modal = '''import React, { useState, useEffect } from 'react';
import { 
  Settings, Key, Mail, Terminal, Copy, Check, X, 
  ShieldCheck, Zap, Server, Clock, Lock, Sparkles, Database, Play
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
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

  const [copiedServerCmd, setCopiedServerCmd] = useState(false);
  const [copiedMasterScript, setCopiedMasterScript] = useState(false);

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

  // 🌟 1-CLICK SERVER STARTER COMMAND (FOR INSTANT COPY-PASTE)
  const serverStarterCommand = `python3 - << 'EOF'
with open("expense_engine.py", "r", encoding="utf-8") as f:
    code = f.read()
if "fetch_cbo_expense = run" not in code:
    with open("expense_engine.py", "a", encoding="utf-8") as f:
        f.write("\\nfetch_cbo_expense = run\\n")
