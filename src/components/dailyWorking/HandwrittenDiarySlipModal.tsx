import React, { useState, useMemo } from 'react';
import { 
  StickyNote, X, Printer, MessageCircle, Calendar, Palette, Check, Eye, EyeOff 
} from 'lucide-react';
import { PlannedCallItem } from '../../data/dailyWorkingStore';
import { DayReminderItem } from '../DailyWorkingWorkspace';

interface HandwrittenDiarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  dayOfWeekName: string;
  selectedAreas?: string[];
  plannedCalls: PlannedCallItem[];
  reminders: DayReminderItem[];
  beName?: string;
}

// 🌟 CIRCLE NUMBERS 1 TO 50 (NO 12-DOCTOR CUTOFF!)
const CIRCLE_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', 
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
  '㉑', '㉒', '㉓', '㉔', '㉕', '㉖', '㉗', '㉘', '㉙', '㉚',
  '㉛', '㉜', '㉝', '㉞', '㉟', '㊱', '㊲', '㊳', '㊴', '㊵',
  '㊶', '㊷', '㊸', '㊹', '㊺', '㊻', '㊼', '㊽', '㊾', '㊿'
];

export const HandwrittenDiarySlipModal: React.FC<HandwrittenDiarySlipModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  dayOfWeekName,
  plannedCalls,
  reminders,
  beName = 'BANWARI LAL MEENA (Udaipur HQ)'
}) => {
  // 🌟 Toggle: Date Print karni hai ya nahi (User Control)
  const [showDate, setShowDate] = useState<boolean>(true);
  
  // 🌟 Toggle: Royal Blue Fountain Pen vs Deep Black Gel Pen
  const [inkColor, setInkColor] = useState<'blue' | 'black'>('blue');

  // 🌟 DUAL READER FOR REMINDERS: Ensures reminders never get missed
  const activeReminders = useMemo(() => {
    if (reminders && reminders.length > 0) return reminders;
    try {
      const saved = localStorage.getItem(`dios_day_reminders_${dateStr}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }, [reminders, dateStr]);

  if (!isOpen) return null;

  const inkHex = inkColor === 'blue' ? '#1E3A8A' : '#111827';

  // WhatsApp Share Message
  const handleShareToWhatsApp = () => {
    const lines: string[] = [];
    lines.push(`🕉️ *ॐ नमो भगवते वासुदेवाय नमः* 🕉️`);
    if (showDate) {
      lines.push(`📅 *DATE: ${dateStr} (${dayOfWeekName})*`);
    }
    lines.push(``);

    plannedCalls.forEach((call, i) => {
      const numSymbol = CIRCLE_NUMBERS[i] || `(${i + 1})`;
      const actStr = call.activityType && call.activityType !== 'REGULAR' ? ` - ${call.activityType}` : '';
      const timeStr = call.approxTime ? ` (${call.approxTime})` : '';
      lines.push(`${numSymbol} *Dr. ${call.doctorName}*${actStr}${timeStr}`);
    });

    if (activeReminders.length > 0) {
      lines.push(``);
      lines.push(`📌 *REMINDERS / SPECIAL NOTES:*`);
      activeReminders.forEach((r) => {
        lines.push(`• *Dr. ${r.doctorName}:* ${r.note}`);
      });
    }

    lines.push(``);
    lines.push(`👤 *Executive:* ${beName}`);

    const fullMsg = lines.join('\n');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* GOOGLE FONTS INJECTION FOR REAL HANDWRITING & MULTI-PAGE PRINT */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@700&display=swap');
        
        .handwritten-english {
          font-family: 'Caveat', cursive, sans-serif;
          letter-spacing: 0.5px;
        }

        .handwritten-hindi {
          font-family: 'Kalam', cursive, sans-serif;
          letter-spacing: 1px;
        }

        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #FFFDF9 !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-handwritten-slip, #printable-handwritten-slip * {
            visibility: visible;
          }
          #printable-handwritten-slip {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            background: #FFFDF9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .diary-row-item {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* MODAL CONTROL HEADER */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <StickyNote size={16} />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Handwritten Diary Slip ({plannedCalls.length} Doctors)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 🌟 1. DATE PRINT TOGGLE (ON / OFF) */}
            <button
              type="button"
              onClick={() => setShowDate(!showDate)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                showDate 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-sm' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle whether Date prints on top of slip"
            >
              {showDate ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} />}
              <span>Date Print: <b className={showDate ? 'text-emerald-300' : 'text-slate-400'}>{showDate ? 'ON' : 'OFF'}</b></span>
            </button>

            {/* 🌟 2. INK COLOR SWITCH (Blue / Black) */}
            <button
              type="button"
              onClick={() => setInkColor(inkColor === 'blue' ? 'black' : 'blue')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                inkColor === 'blue'
                  ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                  : 'bg-slate-900 text-slate-200 border-slate-700'
              }`}
              title="Switch Fountain Pen Ink Color"
            >
              <span>{inkColor === 'blue' ? '✒️ Royal Blue' : '🖋️ Pilot Black'}</span>
            </button>

            {/* WHATSAPP SHARE */}
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer shadow"
              title="Share to WhatsApp"
            >
              <MessageCircle size={15} className="fill-white" />
            </button>

            {/* PRINT BUTTON */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              <Printer size={13} /> Print
            </button>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 📜 AUTHENTIC RULED NOTEBOOK PAPER VIEW (WITH REAL FOUNTAIN PEN STROKES) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60 flex justify-center">
          <div
            id="printable-handwritten-slip"
            className="w-full max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl space-y-4 select-text transition-all duration-300 relative"
            style={{
              backgroundColor: '#FFFDF9',
              backgroundImage: 'repeating-linear-gradient(#FFFDF9, #FFFDF9 31px, #CBD5E1 32px)',
              borderLeft: '5px solid #EF4444',
              color: inkHex,
              lineHeight: '32px'
            }}
          >
            {/* TOP SHLOKA INVOCATION (AUTHENTIC HANDWRITING) */}
            <div className="text-center pb-1">
              <div 
                className="handwritten-hindi text-xl md:text-2xl font-bold tracking-wider inline-block border-b-2 pb-0.5"
                style={{ borderColor: inkHex }}
              >
                ॐ नमो भगवते वासुदेवाय नमः
              </div>

              {/* 🌟 DATE ONLY (NO AREA! CONDITIONAL ON / OFF) */}
              {showDate && (
                <div className="handwritten-english text-lg md:text-xl font-bold mt-1 opacity-90">
                  Date: {dateStr} ({dayOfWeekName})
                </div>
              )}
            </div>

            {/* 🌟 ALL PLANNED DOCTORS LISTED (NO 12-ROW LIMIT!) */}
            <div className="space-y-1 handwritten-english text-lg md:text-xl font-bold">
              {(!plannedCalls || plannedCalls.length === 0) ? (
                <div className="text-center py-6 italic opacity-60">
                  No doctors planned for this day.
                </div>
              ) : (
                plannedCalls.map((c, i) => {
                  const circleNum = CIRCLE_NUMBERS[i] || `(${i + 1})`;
                  const actName = c.activityType && c.activityType !== 'REGULAR' ? ` - ${c.activityType}` : '';
                  const time = c.approxTime ? ` (${c.approxTime})` : '';

                  return (
                    <div key={c.srNo} className="diary-row-item flex items-baseline justify-between gap-2 border-b border-slate-300/40 pb-0.5">
                      <span className="truncate">
                        <span className="mr-2 opacity-80 text-base">{circleNum}</span>
                        Dr. {c.doctorName}{actName}
                      </span>
                      <span className="text-sm md:text-base font-bold shrink-0 opacity-85">
                        {time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* 🌟 REMINDERS / SPECIAL NOTES (ALWAYS LOADED & DISPLAYED) */}
            {activeReminders.length > 0 && (
              <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-400 space-y-1.5">
                <div className="handwritten-english text-lg md:text-xl font-bold uppercase tracking-wider text-rose-600">
                  📌 Reminders / Special Notes:
                </div>
                {activeReminders.map((r) => (
                  <div key={r.id} className="diary-row-item handwritten-english text-lg md:text-xl font-bold leading-relaxed">
                    • Dr. {r.doctorName}: {r.note}
                  </div>
                ))}
              </div>
            )}

            {/* FOOTER */}
            <div className="pt-3 text-right handwritten-english text-base md:text-lg font-bold opacity-80 border-t border-slate-300">
              BE: {beName}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
