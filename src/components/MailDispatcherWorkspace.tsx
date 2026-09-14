import React, { useState, useMemo } from 'react';
import { 
  Mail, Send, Key, ExternalLink, Check, Trash2, Edit3, Plus, 
  FileSpreadsheet, FileText, CheckSquare, Square, Users, 
  User, ShieldCheck, Sparkles, RefreshCw, Loader2, AlertTriangle, 
  ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, Radio
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { buildSheet14_Msl } from '../exporters/sheets/buildSheet14_Msl';
import { buildSheet17_ConversionDrList } from '../exporters/sheets/buildSheet17_ConversionDrList';
import { exportExpenseStatementToPdf } from '../exporters/expensePdfExporter';
import { REAL_AUGUST_ROWS } from './ExpenseWorkspace';

interface RecipientContact {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
}

const DEFAULT_5_RECIPIENTS: RecipientContact[] = [
  { id: 'rec_1', name: 'Reporting Manager (ABM / ZSM)', email: 'manager.dios@gmail.com', role: 'Reporting Manager', enabled: true },
  { id: 'rec_2', name: 'Head Office (HO Review Desk)', email: 'reports.diosho@gmail.com', role: 'Review Desk', enabled: true },
  { id: 'rec_3', name: 'Regional Sales Manager (RSM)', email: 'rsm.rajasthan@gmail.com', role: 'Zonal Head', enabled: false },
  { id: 'rec_4', name: 'Dispatch & Sales Operations', email: 'dispatch.dios@gmail.com', role: 'Operations', enabled: false },
  { id: 'rec_5', name: 'Banwari Lal Meena (Self Backup)', email: 'banwarimeena.dios@gmail.com', role: 'Personal Copy', enabled: true }
];

export const MailDispatcherWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // 1. SMTP Credentials & Google 16-Digit Key
  const [senderEmail, setSenderEmail] = useState(() => {
    return localStorage.getItem('dios_smtp_sender_email') || 'banwarimeena.dios@gmail.com';
  });

  const [googleKey, setGoogleKey] = useState(() => {
    return localStorage.getItem('dios_smtp_google_16_key') || '';
  });

  const [showKey, setShowKey] = useState(false);

  // 2. Recipients State (5 slots default)
  const [recipients, setRecipients] = useState<RecipientContact[]>(() => {
    try {
      const saved = localStorage.getItem('dios_mail_recipients_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_5_RECIPIENTS;
  });

  const [sendMode, setSendMode] = useState<'ALL_ENABLED' | 'SINGLE'>('ALL_ENABLED');
  const [singleTargetEmail, setSingleTargetEmail] = useState<string>(DEFAULT_5_RECIPIENTS[0].email);

  // 3. Selected Attachments Checklist
  const [attachMsl14, setAttachMsl14] = useState(true);
  const [attachConversion17, setAttachConversion17] = useState(true);
  const [attachExpensePdf, setAttachExpensePdf] = useState(true);

  // 4. Email Subject & Body Text
  const [subject, setSubject] = useState('DIOS Reports & Review Formats - Udaipur HQ (BE: Banwari Lal Meena)');
  const [bodyText, setBodyText] = useState(
`Respected Sir,

Please find attached the official monthly performance review formats and statements for Udaipur HQ (BE: Banwari Lal Meena).

Attached Reports:
• 14. MSL Schedule (Master Specialty List & Visit Dates) .xlsx
• 17. Conversion Doctor List (July-Nov Calls & Reminders) .xlsx
• Official Expense Statement .pdf

Kindly acknowledge the receipt.

Regards,
Banwari Lal Meena
Business Executive (Udaipur HQ)
DIOS LIFESCIENCES PVT LTD`
  );

  // Status & Progress
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Add Recipient Modal
  const [editingRec, setEditingRec] = useState<RecipientContact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');

  const persistRecipients = (updated: RecipientContact[]) => {
    setRecipients(updated);
    try {
      localStorage.setItem('dios_mail_recipients_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveCredentials = () => {
    try {
      localStorage.setItem('dios_smtp_sender_email', senderEmail.trim());
      localStorage.setItem('dios_smtp_google_16_key', googleKey.trim());
      setStatusMsg({ type: 'success', text: '💾 Google 16-Digit Key & Sender Email saved securely!' });
    } catch (e) {}
  };

  const handleToggleRecipient = (id: string) => {
    const updated = recipients.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    persistRecipients(updated);
  };

  const handleStartEdit = (r: RecipientContact) => {
    setEditingRec(r);
    setEditName(r.name);
    setEditEmail(r.email);
    setEditRole(r.role);
  };

  const handleSaveEdit = () => {
    if (!editingRec) return;
    if (!editEmail.trim()) {
      alert("Email address zaroori hai!");
      return;
    }
    const updated = recipients.map(r => r.id === editingRec.id ? {
      ...r,
      name: editName.trim() || r.name,
      email: editEmail.trim(),
      role: editRole.trim() || r.role
    } : r);
    persistRecipients(updated);
    setEditingRec(null);
  };

  const handleDeleteRecipient = (id: string) => {
    if (window.confirm("Kya aap is email slot ko delete karna chahte hain?")) {
      persistRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const handleAddNewRecipient = () => {
    const newId = 'rec_' + Date.now();
    const newRec: RecipientContact = {
      id: newId,
      name: 'New Contact',
      email: 'sir@dioslifesciences.com',
      role: 'Manager',
      enabled: true
    };
    persistRecipients([...recipients, newRec]);
    handleStartEdit(newRec);
  };

  // 🚀 DISPATCH EMAIL WITH REAL IN-MEMORY ATTACHMENTS
  const handleDispatchEmail = async () => {
    if (!senderEmail.trim()) {
      alert("Kripya apna Sender Gmail address enter karein!");
      return;
    }
    if (!googleKey.trim()) {
      alert("Kripya Google 16-Digit Security Key enter karein!");
      return;
    }

    const targetList: string[] = [];
    if (sendMode === 'SINGLE') {
      if (!singleTargetEmail.trim()) {
        alert("Kripya target email select karein!");
        return;
      }
      targetList.push(singleTargetEmail.trim());
    } else {
      recipients.filter(r => r.enabled).forEach(r => {
        if (r.email.trim()) targetList.push(r.email.trim());
      });
    }

    if (targetList.length === 0) {
      alert("Koi recipient email select nahi hai! Checkbox tick karein.");
      return;
    }

    setIsSending(true);
    setStatusMsg(null);

    try {
      // 1. Compile attachments dynamically
      const attachmentsPayload: Array<{ filename: string; content_base64: string }> = [];

      // A. Sheet 14 MSL Schedule (.xlsx)
      if (attachMsl14) {
        const wb14 = XLSX.utils.book_new();
        const s14 = buildSheet14_Msl();
        const ws14 = XLSX.utils.aoa_to_sheet(s14.wsData);
        ws14['!merges'] = s14.merges;
        ws14['!cols'] = s14.cols;
        ws14['!rows'] = s14.rows;
        XLSX.utils.book_append_sheet(wb14, ws14, s14.sheetName);
        const b64 = XLSX.write(wb14, { bookType: 'xlsx', type: 'base64' });
        attachmentsPayload.push({
          filename: '14_MSL_Schedule_2026.xlsx',
          content_base64: b64
        });
      }

      // B. Sheet 17 Conversion Dr List (.xlsx)
      if (attachConversion17) {
        const wb17 = XLSX.utils.book_new();
        const s17 = buildSheet17_ConversionDrList();
        const ws17 = XLSX.utils.aoa_to_sheet(s17.wsData);
        ws17['!merges'] = s17.merges;
        ws17['!cols'] = s17.cols;
        ws17['!rows'] = s17.rows;
        XLSX.utils.book_append_sheet(wb17, ws17, s17.sheetName);
        const b64 = XLSX.write(wb17, { bookType: 'xlsx', type: 'base64' });
        attachmentsPayload.push({
          filename: '17_Conversion_Dr_List_Udaipur.xlsx',
          content_base64: b64
        });
      }

      // C. Expense Statement Official PDF (.pdf)
      if (attachExpensePdf) {
        const pdfRes = exportExpenseStatementToPdf({
          selectedMonth: 'Aug-2026',
          headerInfo: {
            name: 'BANWARI LAL MEENA',
            code: 'RJ/SL/0042',
            hq: 'UDAIPUR',
            division: 'DIOS GROUP',
            state: 'RAJASTHAN',
            designation: 'BUSINESS EXECUTIVE',
            approvalStatus: 'Pending',
            monthDateStr: '01/08/2026'
          },
          rows: REAL_AUGUST_ROWS,
          totals: {
            totKm: 1158, totTa: 2895, totDa: 4620, totOther: 270, totClaim: 7785,
            totDrs: 157, totChem: 7, totStk: 1,
            localDays: 13, localAmt: 3380, exDays: 4, exAmt: 1140, osDays: 0, osAmt: 0,
            activeMiscVal: 270
          },
          allowanceSummary: [],
          miscSummary: [],
          hideMiscValues: false,
          blankPerfValues: false
        });
        const pdfUri = pdfRes.doc.output('datauristring');
        const pdfB64 = pdfUri.split(',')[1] || '';
        attachmentsPayload.push({
          filename: 'Expense_Statement_Aug_2026_Official.pdf',
          content_base64: pdfB64
        });
      }

      // 2. Send via Backend Endpoint
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_config: {
            sender_email: senderEmail.trim(),
            app_key: googleKey.replace(/ /g, '').trim(),
            host: 'smtp.gmail.com',
            port: 587
          },
          recipients: targetList,
          subject: subject.trim(),
          body: bodyText.trim(),
          attachments: attachmentsPayload
        })
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'SMTP dispatch failed');
      }

      setStatusMsg({
        type: 'success',
        text: `🎉 SUCCESS! Email successfully sent with ${attachmentsPayload.length} attachment(s) to: ${targetList.join(', ')}!`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `❌ Email Delivery Error: ${err.message}`
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg">
            <Mail size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Direct Mail to Sir &amp; HO (SMTP Engine)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Google 16-Digit Key Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">1-Click Email Dispatcher &bull; Pre-Fed Recipients &bull; Live Excel/PDF Attachments</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-cyan-400 cursor-pointer self-start lg:self-auto"
        >
          <ArrowLeft size={15} /> Back to Web Data
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
          statusMsg.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' : 'bg-rose-950/90 border-rose-500 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
            <span className="font-semibold">{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* 🌟 1. GOOGLE 16-DIGIT KEY & SMTP CONFIGURATION BOX (WITH DIRECT KEY LINK) */}
      <div className="p-5 bg-slate-900 rounded-2xl border-2 border-cyan-500/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-yellow-400" />
            <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
              Google 16-Digit Security Key &amp; Sender Config
            </h3>
          </div>

          {/* 🌟 DIRECT LINK BUTTON TO GET 16-DIGIT KEY FROM GOOGLE */}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
            title="Opens Google App Passwords page directly"
          >
            <ExternalLink size={13} />
            <span>🔗 Get Google 16-Digit Security Key</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Sender Gmail Address:</label>
            <input
              type="email"
              value={senderEmail}
              onChange={e => setSenderEmail(e.target.value)}
              placeholder="e.g. banwarimeena.dios@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-yellow-400 font-bold flex items-center gap-1">
                <Lock size={12} /> Google 16-Digit Security Key:
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showKey ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx (16-Digit Key)"
                className="w-full bg-slate-950 border border-yellow-500/60 text-yellow-300 font-mono font-black text-sm rounded-xl px-3 py-2 focus:border-yellow-400 focus:outline-none tracking-widest"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>💡 Google account me 2-Step Verification ON hone par upar diye link se 16-digit key banti hai.</span>
          <button
            type="button"
            onClick={handleSaveCredentials}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            💾 Save Key
          </button>
        </div>
      </div>

      {/* 🌟 2. 5 PRE-FED RECIPIENT MANAGEMENT (ADD/EDIT/DELETE + SINGLE/GROUP TOGGLE) */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cyan-400" />
            <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
              Recipients Directory ({recipients.length} Slots Pre-Fed)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewRecipient}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus size={13} /> + Add Recipient
            </button>
          </div>
        </div>

        {/* Dispatch Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Dispatch Mode:</span>
          
          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold transition ${
            sendMode === 'ALL_ENABLED' ? 'bg-cyan-600 text-white border-cyan-400 shadow' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <input type="radio" name="sendMode" checked={sendMode === 'ALL_ENABLED'} onChange={() => setSendMode('ALL_ENABLED')} className="hidden" />
            <Users size={14} /> Send to ALL Checked ({recipients.filter(r => r.enabled).length})
          </label>

          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold transition ${
            sendMode === 'SINGLE' ? 'bg-purple-600 text-white border-purple-400 shadow' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <input type="radio" name="sendMode" checked={sendMode === 'SINGLE'} onChange={() => setSendMode('SINGLE')} className="hidden" />
            <User size={14} /> Send to Single Recipient
          </label>

          {sendMode === 'SINGLE' && (
            <select
              value={singleTargetEmail}
              onChange={e => setSingleTargetEmail(e.target.value)}
              className="bg-slate-900 border border-purple-500 text-purple-300 font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              {recipients.map(r => (
                <option key={r.id} value={r.email} className="bg-slate-900 text-white">
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Recipients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {recipients.map(r => (
            <div
              key={r.id}
              className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 text-xs ${
                r.enabled ? 'bg-slate-950 border-cyan-500/50' : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <button
                  type="button"
                  onClick={() => handleToggleRecipient(r.id)}
                  className="text-cyan-400 cursor-pointer"
                  title="Toggle active"
                >
                  {r.enabled ? <CheckSquare size={17} className="text-cyan-400" /> : <Square size={17} className="text-slate-600" />}
                </button>
                
                <div className="truncate">
                  <div className="font-bold text-white truncate">{r.name}</div>
                  <div className="text-[11px] text-cyan-300 font-mono truncate">{r.email}</div>
                  <div className="text-[10px] text-slate-500">{r.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(r)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-900 cursor-pointer"
                  title="Edit Contact"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRecipient(r.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 cursor-pointer"
                  title="Delete Contact"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🌟 3. REPORT / ATTACHMENT SELECTOR (WHICH SHEETS TO ATTACH?) */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-emerald-400" />
            Select Reports to Attach in Email:
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {[attachMsl14, attachConversion17, attachExpensePdf].filter(Boolean).length} Files Selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <label className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
            attachMsl14 ? 'bg-slate-950 border-cyan-500/60 shadow-md' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <input type="checkbox" checked={attachMsl14} onChange={e => setAttachMsl14(e.target.checked)} className="h-4 w-4 rounded text-cyan-500 cursor-pointer" />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-cyan-400" /> Sheet 14: MSL Schedule
              </div>
              <div className="text-[10px] text-slate-400 font-mono">14_MSL_Schedule_2026.xlsx</div>
            </div>
          </label>

          <label className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
            attachConversion17 ? 'bg-slate-950 border-amber-500/60 shadow-md' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <input type="checkbox" checked={attachConversion17} onChange={e => setAttachConversion17(e.target.checked)} className="h-4 w-4 rounded text-amber-500 cursor-pointer" />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-amber-400" /> Sheet 17: Conversion Dr List
              </div>
              <div className="text-[10px] text-slate-400 font-mono">17_Conversion_Dr_List_Udaipur.xlsx</div>
            </div>
          </label>

          <label className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
            attachExpensePdf ? 'bg-slate-950 border-purple-500/60 shadow-md' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <input type="checkbox" checked={attachExpensePdf} onChange={e => setAttachExpensePdf(e.target.checked)} className="h-4 w-4 rounded text-purple-500 cursor-pointer" />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <FileText size={14} className="text-purple-400" /> Expense Statement (Official)
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Expense_Statement_Aug_2026.pdf</div>
            </div>
          </label>

        </div>
      </div>

      {/* 🌟 4. EMAIL COMPOSER (SUBJECT & COVER LETTER BODY) */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
          Email Subject &amp; Cover Letter (Editable)
        </h3>

        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Subject Line:</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded-xl px-3 py-2 text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Cover Letter Body:</label>
          <textarea
            rows={6}
            value={bodyText}
            onChange={e => setBodyText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-sans rounded-xl p-3 text-xs focus:border-cyan-400 focus:outline-none leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* 🚀 5. FINAL SEND TRIGGER BUTTON */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 font-mono">
          Ready to dispatch: <b className="text-white">{sendMode === 'SINGLE' ? singleTargetEmail : `${recipients.filter(r => r.enabled).length} Recipients`}</b> &bull; Attachments: <b className="text-cyan-300">{[attachMsl14, attachConversion17, attachExpensePdf].filter(Boolean).length} Files</b>
        </div>

        <button
          type="button"
          onClick={handleDispatchEmail}
          disabled={isSending}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>{isSending ? 'Sending Email to Sir...' : '🚀 SEND EMAIL TO SIR NOW'}</span>
        </button>
      </div>

      {/* EDIT RECIPIENT MODAL */}
      {editingRec && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Recipient Details</h3>
              <button onClick={() => setEditingRec(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Name / Title:</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Address *:</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Role / Designation:</label>
                <input type="text" value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button onClick={() => setEditingRec(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow">Save Contact</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
