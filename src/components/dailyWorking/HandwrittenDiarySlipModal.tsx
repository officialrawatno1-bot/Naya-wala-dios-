import React, { useState, useMemo, useRef } from 'react';
import { 
  StickyNote, X, Printer, MessageCircle, Calendar, Palette, Check, Eye, EyeOff,
  Share2, Download, Image as ImageIcon, Loader2
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
  dayRemarks?: string;
  beName?: string;
}

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
  dayRemarks = '',
  beName = 'BANWARI LAL MEENA (Udaipur HQ)'
}) => {
  const [showDate, setShowDate] = useState<boolean>(true);
  const [inkColor, setInkColor] = useState<'blue' | 'black'>('blue');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  // Dual Reader for Reminders
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

  // 🌟 NATIVE HIGH-RES 2D CANVAS GENERATOR (100% IMMUNE TO OKLCH ERROR!)
  const generateSlipCanvas = (): HTMLCanvasElement => {
    const width = 850;
    const lineHeight = 38;

    let lineCount = 4;
    lineCount += Math.max(1, plannedCalls.length);
    if (activeReminders.length > 0) lineCount += activeReminders.length + 2;
    if (dayRemarks && dayRemarks.trim().length > 0) lineCount += 3;
    lineCount += 4;

    const height = Math.max(920, lineCount * lineHeight + 120);

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.scale(2, 2);

    // 1. Cream Paper
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    // 2. Ruled Faint Blue Lines
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    for (let y = 145; y < height - 50; y += lineHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Left Red Margin Line
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(55, 0);
    ctx.lineTo(55, height);
    ctx.stroke();

    // 4. Shloka Invocation (Kalam font)
    ctx.fillStyle = inkHex;
    ctx.font = 'bold 26px "Kalam", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ॐ नमो भगवते वासुदेवाय नमः', width / 2, 60);

    ctx.strokeStyle = inkHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 140, 72);
    ctx.lineTo(width / 2 + 140, 72);
    ctx.stroke();

    // 5. Date Only (No area!)
    if (showDate) {
      ctx.font = 'bold 22px "Caveat", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Date: ${dateStr} (${dayOfWeekName})`, width / 2, 108);
    }

    // 6. Planned Doctors (All of them, no limit)
    let currentY = 145;
    ctx.font = 'bold 22px "Caveat", cursive, sans-serif';

    plannedCalls.forEach((call, i) => {
      currentY += lineHeight;
      const numSymbol = CIRCLE_NUMBERS[i] || `(${i + 1})`;
      const actStr = call.activityType && call.activityType !== 'REGULAR' ? ` - ${call.activityType}` : '';
      const timeStr = call.approxTime ? ` (${call.approxTime})` : '';

      ctx.textAlign = 'left';
      ctx.fillText(`${numSymbol}  Dr. ${call.doctorName}${actStr}`, 70, currentY - 8);

      if (timeStr) {
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, width - 40, currentY - 8);
      }
    });

    // 7. Reminders
    if (activeReminders.length > 0) {
      currentY += lineHeight;
      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 21px "Caveat", cursive, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📌 Reminders / Special Notes:', 70, currentY - 8);

      ctx.fillStyle = inkHex;
      activeReminders.forEach((r) => {
        currentY += lineHeight;
        ctx.fillText(`• Dr. ${r.doctorName}: ${r.note}`, 85, currentY - 8);
      });
    }

    // 8. Day Remarks
    if (dayRemarks && dayRemarks.trim().length > 0) {
      currentY += lineHeight;
      ctx.fillStyle = '#2563EB';
      ctx.font = 'bold 21px "Caveat", cursive, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📝 Day Remarks:', 70, currentY - 8);

      ctx.fillStyle = inkHex;
      currentY += lineHeight;
      ctx.fillText(dayRemarks.trim(), 85, currentY - 8);
    }

    // 9. Footer
    currentY += lineHeight + 15;
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px "Caveat", cursive, sans-serif';
    ctx.fillStyle = inkHex;
    ctx.fillText(`BE: ${beName}`, width - 40, currentY - 8);

    return canvas;
  };

  // Share High-Res Photo via Native iPad iOS Share Sheet (WhatsApp)
  const handleShareSlipAsImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = generateSlipCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGeneratingImage(false);
          return;
        }

        const fileName = `Diary_Slip_${dateStr.replace(/\//g, '-')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Diary Slip - ${dateStr}`,
              text: `🕉️ ॐ नमो भगवते वासुदेवाय नमः • Day Working Plan (${dateStr})`
            });
          } catch (e) {}
        } else {
          // Direct Download fallback
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          alert("🎉 Slip ki HD Photo save ho gayi! Aap ise WhatsApp me share kar sakte hain.");
        }
        setIsGeneratingImage(false);
      }, 'image/png');
    } catch (err: any) {
      setIsGeneratingImage(false);
      alert("Error: " + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
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

      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 gap-2 shrink-0">
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
              title="Toggle Date on top of slip"
            >
              {showDate ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} />}
              <span>Date Print: <b className={showDate ? 'text-emerald-300' : 'text-slate-400'}>{showDate ? 'ON' : 'OFF'}</b></span>
            </button>

            {/* 🌟 2. INK COLOR SWITCH */}
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

            {/* 🌟 3. SEND REAL PHOTO TO WHATSAPP */}
            <button
              type="button"
              onClick={handleShareSlipAsImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-950"
              title="Send authentic Handwritten Slip Photo directly to WhatsApp"
            >
              {isGeneratingImage ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
              <span>{isGeneratingImage ? "Generating Photo..." : "💬 Send Photo (WhatsApp)"}</span>
            </button>

            {/* PRINT */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              <Printer size={13} /> Print
            </button>

            {/* CLOSE */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 📜 EXPANSIVE NOTEBOOK PAPER VIEW (100% ENCLOSING ALL DOCTORS, REMINDERS & REMARKS) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/80 flex justify-center">
          <div
            id="printable-handwritten-slip"
            className="w-full max-w-xl p-6 sm:p-10 rounded-2xl shadow-2xl space-y-4 select-text transition-all duration-300 relative"
            style={{
              backgroundColor: '#FFFDF9',
              backgroundImage: 'repeating-linear-gradient(#FFFDF9, #FFFDF9 31px, #CBD5E1 32px)',
              borderLeft: '6px solid #EF4444',
              color: inkHex,
              lineHeight: '32px',
              minHeight: '880px',
              height: 'auto'
            }}
          >
            {/* INVOCATION */}
            <div className="text-center pb-1">
              <div 
                className="handwritten-hindi text-xl md:text-2xl font-bold tracking-wider inline-block border-b-2 pb-0.5"
                style={{ borderColor: inkHex }}
              >
                ॐ नमो भगवते वासुदेवाय नमः
              </div>

              {/* DATE ONLY */}
              {showDate && (
                <div className="handwritten-english text-base md:text-lg font-bold mt-1 opacity-90">
                  Date: {dateStr} ({dayOfWeekName})
                </div>
              )}
            </div>

            {/* ALL DOCTORS LISTED COMPLETELY */}
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

            {/* REMINDERS (INSIDE PAPER) */}
            {activeReminders.length > 0 && (
              <div className="pt-3 mt-3 border-t-2 border-dashed border-slate-400 space-y-1">
                <div className="handwritten-english text-base md:text-lg font-bold uppercase tracking-wider text-rose-600">
                  📌 Reminders / Special Notes:
                </div>
                {activeReminders.map((r) => (
                  <div key={r.id} className="diary-row-item handwritten-english text-base md:text-lg font-bold leading-tight">
                    • Dr. {r.doctorName}: {r.note}
                  </div>
                ))}
              </div>
            )}

            {/* 🌟 DAY REMARKS (INSIDE PAPER UNDER REMINDERS) */}
            {dayRemarks && dayRemarks.trim().length > 0 && (
              <div className="pt-3 mt-3 border-t-2 border-dashed border-slate-400 space-y-1">
                <div className="handwritten-english text-base md:text-lg font-bold uppercase tracking-wider text-blue-700">
                  📝 Day Remarks:
                </div>
                <div className="diary-row-item handwritten-english text-base md:text-lg font-bold leading-relaxed whitespace-pre-wrap">
                  {dayRemarks.trim()}
                </div>
              </div>
            )}

            {/* FOOTER (INSIDE PAPER) */}
            <div className="pt-4 text-right handwritten-english text-base md:text-lg font-bold opacity-80 border-t border-slate-300">
              BE: {beName}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
