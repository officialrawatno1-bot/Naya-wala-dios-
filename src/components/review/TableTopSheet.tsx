import React, { useState } from 'react';
import { 
  Layers, Download, Plus, Trash2, Edit3
} from 'lucide-react';
import { CloudSyncBar } from '../CloudSyncBar';

const STORAGE_KEY = 'dios_table_top_campaign_permanent_v2';
const TITLE_STORAGE_KEY = 'dios_table_top_title_permanent_v1';

export interface TableTopRow {
  sn: number;
  drName: string;
  hq: string;
  speciality: string;
  activityDone: string;
  prescriberStatus: string;
  rxPerMonth: string;
}

export interface TableTopSection {
  id: string;
  productName: string;
  rows: TableTopRow[];
}

const INITIAL_SECTIONS_SEED: TableTopSection[] = [
  {
    id: 'sec_linaget',
    productName: 'LINAGET',
    rows: [
      { sn: 1, drName: 'SANDEEP KANSARA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '15' },
      { sn: 2, drName: 'VINOD BOKADIYA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '20' },
      { sn: 3, drName: 'JAI CHORDIYA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: 'PENDING', prescriberStatus: 'NON PRESCRIBER', rxPerMonth: '0' }
    ]
  },
  {
    id: 'sec_vintel',
    productName: 'VINTEL',
    rows: [
      { sn: 1, drName: 'MANISH KULSHRESHT', hq: 'UDAIPUR', speciality: 'NEURO', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '25' },
      { sn: 2, drName: 'JITESH AGRAWAL', hq: 'UDAIPUR', speciality: 'PHY', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '18' },
      { sn: 3, drName: 'SATISH CHOUDHARY', hq: 'UDAIPUR', speciality: 'PHY', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '15' }
    ]
  }
];

export const TableTopSheet: React.FC = () => {
  const [campaignTitle, setCampaignTitle] = useState<string>(() => {
    try {
      const savedTitle = localStorage.getItem(TITLE_STORAGE_KEY);
      if (savedTitle) return savedTitle;
    } catch (e) {}
    return 'TABLE TOP CAMPAIGN';
  });

  const [sections, setSections] = useState<TableTopSection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SECTIONS_SEED;
  });

  const persistData = (updatedTitle: string, updatedSections: TableTopSection[]) => {
    setCampaignTitle(updatedTitle);
    setSections(updatedSections);
    try {
      localStorage.setItem(TITLE_STORAGE_KEY, updatedTitle);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSections));
    } catch (e) {}
  };

  const handleTitleChange = (newTitle: string) => {
    persistData(newTitle.toUpperCase(), sections);
  };

  const handleSectionNameChange = (sectionId: string, newName: string) => {
    const updated = sections.map(sec => 
      sec.id === sectionId ? { ...sec, productName: newName.toUpperCase() } : sec
    );
    persistData(campaignTitle, updated);
  };

  const handleRowChange = (sectionId: string, sn: number, field: keyof TableTopRow, val: any) => {
    const updated = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const updatedRows = sec.rows.map(r => r.sn === sn ? { ...r, [field]: val } : r);
      return { ...sec, rows: updatedRows };
    });
    persistData(campaignTitle, updated);
  };

  const handleAddRow = (sectionId: string) => {
    const updated = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const nextSn = sec.rows.length > 0 ? Math.max(...sec.rows.map(r => r.sn)) + 1 : 1;
      const newRow: TableTopRow = {
        sn: nextSn,
        drName: '',
        hq: 'UDAIPUR',
        speciality: 'PHY',
        activityDone: 'DONE',
        prescriberStatus: 'PRESCRIBER',
        rxPerMonth: ''
      };
      return { ...sec, rows: [...sec.rows, newRow] };
    });
    persistData(campaignTitle, updated);
  };

  const handleDeleteRow = (sectionId: string, sn: number) => {
    const updated = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, rows: sec.rows.filter(r => r.sn !== sn) };
    });
    persistData(campaignTitle, updated);
  };

  const handleAddSection = () => {
    const newSec: TableTopSection = {
      id: 'sec_' + Date.now(),
      productName: 'NEW BRAND',
      rows: [
        { sn: 1, drName: '', hq: 'UDAIPUR', speciality: 'PHY', activityDone: 'DONE', prescriberStatus: 'PRESCRIBER', rxPerMonth: '' }
      ]
    };
    persistData(campaignTitle, [...sections, newSec]);
  };

  const handleDeleteSection = (sectionId: string, name: string) => {
    if (window.confirm(`Kya aap '${name}' section ko delete karna chahte hain?`)) {
      persistData(campaignTitle, sections.filter(s => s.id !== sectionId));
    }
  };

  // 100% UNTOUCHED Export CSV
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`HQ,${campaignTitle},,,,,`);

    sections.forEach((sec, idx) => {
      lines.push(`PRODUCT NAME,${sec.productName},,,,,`);
      lines.push('S.NO.,DR NAME,HQ,SPECIALITY,ACTIVITY DONE/NOT,PRESCRIBER/NON PRESCRIBER,NO. OF PRESCRIPTION/MONTH');

      sec.rows.forEach(r => {
        const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
        lines.push(`${r.sn},${q(r.drName)},${q(r.hq)},${q(r.speciality)},${q(r.activityDone)},${q(r.prescriberStatus)},${q(r.rxPerMonth)}`);
      });

      if (idx < sections.length - 1) {
        lines.push(',,,,,,');
      }
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '9_TABLE_TOP.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Layers size={18} /></span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">9.</span>
              
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="CAMPAIGN TITLE"
                  className="py-1 px-2.5 bg-slate-950 border border-amber-500/60 rounded-xl font-extrabold text-amber-300 text-sm focus:outline-none focus:border-amber-400 uppercase tracking-wide min-w-[240px] sm:min-w-[280px]"
                />
                <Edit3 size={13} className="absolute right-2.5 text-amber-400/70 pointer-events-none" />
              </div>

              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Editable Title
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">HQ: UDAIPUR • Change Campaign Name &amp; Product Headings Anytime</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus size={14} /> + Add Brand Section
          </button>

          {/* 100% UNTOUCHED Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ☁️ DEDICATED CLOUD SYNC TOOLBAR */}
      <CloudSyncBar
        storageKey="campaigns/sheet_09_table_top"
        sheetTitle={`9. ${campaignTitle || 'Table Top Campaign'}`}
        getData={() => ({ campaignTitle, sections })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.campaignTitle) {
            setCampaignTitle(cloudData.campaignTitle);
          }
          if (cloudData.sections && Array.isArray(cloudData.sections)) {
            setSections(cloudData.sections);
          }
          persistData(cloudData.campaignTitle || campaignTitle, cloudData.sections || sections);
        }}
        onSaveLocal={() => {
          persistData(campaignTitle, sections);
        }}
      />

      {/* CAMPAIGN PRODUCT SECTIONS */}
      <div className="space-y-6">
        {sections.map(sec => {
          const totalRx = sec.rows.reduce((acc, r) => acc + (parseFloat(r.rxPerMonth || '0') || 0), 0);

          return (
            <div key={sec.id} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">PRODUCT NAME:</span>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={sec.productName}
                      onChange={e => handleSectionNameChange(sec.id, e.target.value)}
                      placeholder="PRODUCT NAME"
                      className="py-1 px-2.5 bg-slate-900 border border-amber-500/50 rounded-xl font-black text-cyan-300 text-xs focus:outline-none focus:border-cyan-400 uppercase tracking-wide"
                    />
                    <Edit3 size={12} className="absolute right-2 text-cyan-400/60 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-400 font-mono">
                    Total Rx: <b className="text-emerald-400">{totalRx}</b>
                  </div>

                  <button
                    onClick={() => handleAddRow(sec.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Plus size={13} /> Add Doctor Row
                  </button>

                  <button
                    onClick={() => handleDeleteSection(sec.id, sec.productName)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900 cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                      <th className="p-2.5 text-center w-12">S.NO.</th>
                      <th className="p-2.5 min-w-[200px]">DR NAME</th>
                      <th className="p-2.5 text-center w-28">HQ</th>
                      <th className="p-2.5 text-center w-28">SPECIALITY</th>
                      <th className="p-2.5 text-center min-w-[150px] text-amber-400">ACTIVITY DONE/NOT</th>
                      <th className="p-2.5 text-center min-w-[170px] text-blue-300">PRESCRIBER/NON PRESCRIBER</th>
                      <th className="p-2.5 text-center min-w-[160px] text-emerald-400">NO. OF PRESCRIPTION/MONTH</th>
                      <th className="p-2.5 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sec.rows.map(row => (
                      <tr key={row.sn} className="hover:bg-slate-900/60 transition">
                        <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.drName}
                            onChange={e => handleRowChange(sec.id, row.sn, 'drName', e.target.value)}
                            placeholder="Doctor Name"
                            className="w-full py-1.5 px-2 bg-slate-900 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            value={row.hq}
                            onChange={e => handleRowChange(sec.id, row.sn, 'hq', e.target.value)}
                            className="w-full py-1 bg-slate-900 border border-slate-800 text-center text-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            value={row.speciality}
                            onChange={e => handleRowChange(sec.id, row.sn, 'speciality', e.target.value)}
                            className="w-full py-1 bg-slate-900 border border-slate-800 text-center text-slate-300 rounded text-xs uppercase"
                          />
                        </td>

                        <td className="p-1 text-center">
                          <select
                            value={row.activityDone || '-'}
                            onChange={e => handleRowChange(sec.id, row.sn, 'activityDone', e.target.value)}
                            className={`w-full py-1.5 px-2 rounded-md font-bold text-xs border focus:outline-none cursor-pointer text-center ${
                              row.activityDone === 'DONE' || row.activityDone === 'Done'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                : row.activityDone === 'PENDING'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <option value="DONE" className="bg-slate-900 text-emerald-400">DONE</option>
                            <option value="NOT DONE" className="bg-slate-900 text-rose-400">NOT DONE</option>
                            <option value="PENDING" className="bg-slate-900 text-amber-400">PENDING</option>
                            <option value="-" className="bg-slate-900 text-slate-500">-</option>
                          </select>
                        </td>

                        <td className="p-1 text-center">
                          <select
                            value={row.prescriberStatus || '-'}
                            onChange={e => handleRowChange(sec.id, row.sn, 'prescriberStatus', e.target.value)}
                            className={`w-full py-1.5 px-2 rounded-md font-bold text-xs border focus:outline-none cursor-pointer text-center ${
                              row.prescriberStatus === 'PRESCRIBER'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <option value="PRESCRIBER" className="bg-slate-900 text-blue-300">PRESCRIBER</option>
                            <option value="NON PRESCRIBER" className="bg-slate-900 text-slate-400">NON PRESCRIBER</option>
                            <option value="-" className="bg-slate-900 text-slate-500">-</option>
                          </select>
                        </td>

                        <td className="p-1 text-center">
                          <input
                            type="text"
                            value={row.rxPerMonth}
                            onChange={e => handleRowChange(sec.id, row.sn, 'rxPerMonth', e.target.value)}
                            placeholder="0"
                            className="w-full py-1.5 px-2 bg-slate-900 border border-slate-800 text-center font-mono font-bold text-emerald-300 rounded text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </td>

                        <td className="p-1 text-center">
                          <button onClick={() => handleDeleteRow(sec.id, row.sn)} className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
