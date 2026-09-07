import React, { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { memoryStore } from '../../data/memoryStore';
import { CloudSyncBar } from '../CloudSyncBar';

const EXPIRY_PRODUCTS_LIST = [
  "CALGYM 60K CAP", "CALGYM TAB", "VALROS TAB", "CITICURE 500 TAB", "CITICURE PLUS TAB",
  "DIOFLAM TAB", "DIOMILIN NT TAB", "DIOSGLT 10 TAB", "DIOSUL TAB", "DIOZAM 10 TAB",
  "DIOZAM 5 TAB", "ESIPRAM 10MG TAB", "ESIPRAM PLUS TAB", "FITJEE CAP", "FITJEE DM TAB",
  "ISIRON CAP", "NEUTOCID DSR CAP", "NEUTOCID LS TAB", "PREMYLIN M 75 TAB", "PREMYLIN M SR TAB",
  "PROSTADO TAB", "PROSTADO D TAB", "SOLEM 500 TAB", "VALROS 10 TAB", "VALROS 20 TAB",
  "VALROS ASP TAB", "VALROS F TAB", "VALROS GOLD 20 CAP", "VALROS GOLD 10 CAP", "VIDGLIT M FORTE TAB",
  "VIDGLIT M TAB", "VIDGLIT TAB", "VIDMET G 80 TAB", "VIDMET SR 1000MG TAB", "VIDMET SR 500MG TAB",
  "VINTEL 20 TAB", "VINTEL 40 TAB", "VINTEL 40AM TAB", "VINTEL 80 TAB", "VINTEL CT TAB",
  "VINTEL CTC TAB", "VINTEL H40 TAB", "VINTEL H80 TAB", "VINTEL M 25 TAB", "VINTEL M 50 TAB",
  "XILDA M 500 TAB", "XILDA M 1000 TAB", "XILDA TAB"
];

interface ExpiryRow {
  sn: number;
  product: string;
  hq: string;
  stockistName: string;
  quantity: string;
  monthOfExpiry: string;
  planOfLiquidation: string;
}

export const NearByExpirySheet: React.FC = () => {
  const [rows, setRows] = useState<ExpiryRow[]>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_05_expiry');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.rows && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
          return parsed.rows;
        }
      }
    } catch (e) {}
    if (memoryStore.expiryData) {
      return Object.values(memoryStore.expiryData);
    }
    return EXPIRY_PRODUCTS_LIST.map((prod, idx) => ({
      sn: idx + 1,
      product: prod,
      hq: 'UDAIPUR',
      stockistName: '',
      quantity: '',
      monthOfExpiry: '',
      planOfLiquidation: ''
    }));
  });

  const handleFieldChange = (sn: number, field: keyof ExpiryRow, val: string) => {
    setRows(prev => {
      const updated = prev.map(r => r.sn === sn ? { ...r, [field]: val } : r);
      const mapObj: Record<number, ExpiryRow> = {};
      updated.forEach(item => { mapObj[item.sn] = item; });
      memoryStore.expiryData = mapObj;
      return updated;
    });
  };

  // 100% UNTOUCHED Export CSV
  const handleExportCSV = () => {
    let csv = `DETAILS OF PRODUCTS HAVING LESS THAN 8 MONTHS EXPIRY,,,,,,\n`;
    csv += `S. NO,PRODUCT,HQ,STOCKIST NAME,QUANTITY,MONTH OF EXPIRY,PLAN OF LIQUIDATION\n`;
    
    rows.forEach(r => {
      csv += `${r.sn},"${r.product}","${r.hq}","${r.stockistName}","${r.quantity}","${r.monthOfExpiry}","${r.planOfLiquidation}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '5_NEAR_BY_EXPIRY.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><AlertTriangle size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white">5. NEAR BY EXPIRY (&lt; 8 MONTHS)</h2>
            <p className="text-xs text-slate-400">Enter stockist-wise near-by expiry details and liquidation plans</p>
          </div>
        </div>

        {/* 100% UNTOUCHED Export CSV */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ☁️ DEDICATED CLOUD SYNC TOOLBAR */}
      <CloudSyncBar
        storageKey="review/sheet_05_near_by_expiry"
        sheetTitle="5. Near By Expiry (< 8 Months)"
        getData={() => ({ rows })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.rows && Array.isArray(cloudData.rows)) {
            setRows(cloudData.rows);
            const mapObj: Record<number, ExpiryRow> = {};
            cloudData.rows.forEach((item: ExpiryRow) => { mapObj[item.sn] = item; });
            memoryStore.expiryData = mapObj;
            try {
              localStorage.setItem('dios_draft_sheet_05_expiry', JSON.stringify({ rows: cloudData.rows }));
            } catch (e) {}
          }
        }}
        onSaveLocal={() => {
          const mapObj: Record<number, ExpiryRow> = {};
          rows.forEach(item => { mapObj[item.sn] = item; });
          memoryStore.expiryData = mapObj;
          try {
            localStorage.setItem('dios_draft_sheet_05_expiry', JSON.stringify({ rows }));
          } catch (e) {}
        }}
      />

      <div className="overflow-x-auto max-h-[600px] border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="p-2.5 text-center w-12">S. NO</th>
              <th className="p-2.5 min-w-[200px]">Product</th>
              <th className="p-2.5 min-w-[120px]">HQ</th>
              <th className="p-2.5 min-w-[180px]">Stockist Name</th>
              <th className="p-2.5 text-center min-w-[90px]">Quantity</th>
              <th className="p-2.5 text-center min-w-[130px]">Month of Expiry</th>
              <th className="p-2.5 min-w-[200px]">Plan of Liquidation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((row) => (
              <tr key={row.sn} className="hover:bg-slate-800/30 transition">
                <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                <td className="p-2 font-semibold text-white">{row.product}</td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.hq}
                    onChange={e => handleFieldChange(row.sn, 'hq', e.target.value)}
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-lg text-slate-200 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-medium"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.stockistName}
                    onChange={e => handleFieldChange(row.sn, 'stockistName', e.target.value)}
                    placeholder="Stockist Name"
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-lg text-slate-200 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.quantity}
                    onChange={e => handleFieldChange(row.sn, 'quantity', e.target.value)}
                    placeholder="-"
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono font-bold text-amber-300 border border-slate-800 focus:border-amber-500 focus:outline-none text-center text-xs"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.monthOfExpiry}
                    onChange={e => handleFieldChange(row.sn, 'monthOfExpiry', e.target.value)}
                    placeholder="e.g. Nov-2026"
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono text-cyan-300 border border-slate-800 focus:border-amber-500 focus:outline-none text-center text-xs"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.planOfLiquidation}
                    onChange={e => handleFieldChange(row.sn, 'planOfLiquidation', e.target.value)}
                    placeholder="Liquidation Plan..."
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-lg text-slate-200 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
