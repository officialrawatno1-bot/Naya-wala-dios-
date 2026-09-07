import React, { useState } from 'react';
import { 
  Activity, Search, Save, Download, Check, Plus, Trash2, 
  Users, UserCheck, Stethoscope, Sparkles, Layers, Pill, X
} from 'lucide-react';

const STORAGE_KEY = 'dios_glucometer_camp_permanent_v1';

export interface DoctorCampRow {
  sn: number;
  drName: string;
  hq: string;
  speciality: string;
  campDate: string;
  rxInCamp: string;
  apr: string; may: string; jun: string; jul: string; aug: string; sept: string;
  oct: string; nov: string; dec: string; jan: string; feb: string; mar: string;
}

export interface PatientCampRow {
  sn: number;
  patientName: string;
  phoneNo: string;
  brand: string;
  stripsSold: string;
}

const MONTH_COLS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const INITIAL_DOC_SEED: DoctorCampRow[] = [
  {
    sn: 1,
    drName: 'MONA DHINGRA',
    hq: 'UDAIPUR',
    speciality: 'ENDO',
    campDate: '10-Jul',
    rxInCamp: '15',
    apr: '', may: '', jun: '', jul: '12', aug: '', sept: '',
    oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
  }
];

const INITIAL_PATIENT_SEED: PatientCampRow[] = [
  { sn: 1, patientName: 'OM PRAKASH RANAWAT', phoneNo: '', brand: 'LINAGET', stripsSold: '2' },
  { sn: 2, patientName: 'GURUSIKHA SALVI', phoneNo: '', brand: 'LINAGET', stripsSold: '1' },
  { sn: 3, patientName: 'NILESH ARCHARIA', phoneNo: '', brand: 'LINAGET', stripsSold: '2' },
  { sn: 4, patientName: 'KANTI LAL SHARMA', phoneNo: '', brand: 'LINAGET', stripsSold: '1' },
  { sn: 5, patientName: 'BHERU PRASAD', phoneNo: '', brand: 'LINAGET', stripsSold: '2' },
  { sn: 6, patientName: '', phoneNo: '', brand: 'LINAGET', stripsSold: '' },
  { sn: 7, patientName: '', phoneNo: '', brand: 'LINAGET', stripsSold: '' },
  { sn: 8, patientName: '', phoneNo: '', brand: 'LINAGET', stripsSold: '' }
];

export const GlucometerCampSheet: React.FC = () => {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [campDocs, setCampDocs] = useState<DoctorCampRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DOC_SEED;
  });

  const [patients, setPatients] = useState<PatientCampRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_patients');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PATIENT_SEED;
  });

  const persistData = (docs: DoctorCampRow[], pats: PatientCampRow[]) => {
    setCampDocs(docs);
    setPatients(pats);
    try {
      localStorage.setItem(STORAGE_KEY + '_docs', JSON.stringify(docs));
      localStorage.setItem(STORAGE_KEY + '_patients', JSON.stringify(pats));
    } catch (e) {}
  };

  const handleDocChange = (sn: number, field: keyof DoctorCampRow, val: string) => {
    const updated = campDocs.map(d => d.sn === sn ? { ...d, [field]: val } : d);
    persistData(updated, patients);
  };

  const handlePatientChange = (sn: number, field: keyof PatientCampRow, val: string) => {
    const updated = patients.map(p => p.sn === sn ? { ...p, [field]: val } : p);
    persistData(campDocs, updated);
  };

  const handleAddDoctor = () => {
    const nextSn = campDocs.length > 0 ? Math.max(...campDocs.map(d => d.sn)) + 1 : 1;
    const newDoc: DoctorCampRow = {
      sn: nextSn,
      drName: '',
      hq: 'UDAIPUR',
      speciality: 'ENDO',
      campDate: '',
      rxInCamp: '',
      apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
      oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
    };
    persistData([...campDocs, newDoc], patients);
  };

  const handleDeleteDoctor = (sn: number) => {
    if (window.confirm('Kya aap is doctor row ko delete karna chahte hain?')) {
      persistData(campDocs.filter(d => d.sn !== sn), patients);
    }
  };

  const handleAddPatient = () => {
    const nextSn = patients.length > 0 ? Math.max(...patients.map(p => p.sn)) + 1 : 1;
    const newPatient: PatientCampRow = {
      sn: nextSn,
      patientName: '',
      phoneNo: '',
      brand: 'LINAGET',
      stripsSold: ''
    };
    persistData(campDocs, [...patients, newPatient]);
  };

  const handleDeletePatient = (sn: number) => {
    persistData(campDocs, patients.filter(p => p.sn !== sn));
  };

  const handleSave = () => {
    persistData(campDocs, patients);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // 📥 Export Exact 2-Tier CSV matching csv_output/10_GLUCOMETER CAMP.csv
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('HQ,GLUCOMETER CAMPAIGN,,,,,,,,,,,,,,,,,');
    lines.push('PRODUCT NAME,LINAGET,,,,,,NO. OF PRESCRIPTION  GENEREATED IN MONTH,,,,,,,,,,,');
    lines.push('S.NO.,DR NAME,,HQ,SPECIALITY,CAMP DATE,NO. OF Rx GENERATED IN CAMP, APRIL,MAY,JUNE,JULY,AUG,SEP,OCT,NOV,DEC,JAN,FEB,MAR');

    campDocs.forEach(d => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        d.sn, q(d.drName), '', q(d.hq), q(d.speciality), q(d.campDate), q(d.rxInCamp),
        q(d.apr), q(d.may), q(d.jun), q(d.jul), q(d.aug), q(d.sept),
        q(d.oct), q(d.nov), q(d.dec), q(d.jan), q(d.feb), q(d.mar)
      ];
      lines.push(row.join(','));
    });

    lines.push(',,,,,,,,,,,,,,,,,,');
    lines.push(',,,,,,,,,,,,,,,,,,');
    lines.push('S. NO.,PATIENT NAME,PHONE NO.,,BRAND PRESCRIBED,NO. OF STRIPS SOLD ON CAMPAIGN DAY,,,,,,,,,,,,,');

    patients.forEach(p => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      lines.push(`${p.sn},${q(p.patientName)},${q(p.phoneNo)},,${q(p.brand)},${q(p.stripsSold)},,,,,,,,,,,,`);
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '10_GLUCOMETER_CAMP.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalStripsSold = patients.reduce((acc, p) => acc + (parseFloat(p.stripsSold || '0') || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-teal-500/20 text-teal-400 rounded-lg"><Activity size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              10. GLUCOMETER CAMPAIGN (LINAGET)
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Doctor Rx &amp; Patient Strips
              </span>
            </h2>
            <p className="text-xs text-slate-400">HQ: UDAIPUR • Brand: LINAGET • Doctor Monthly Rx &amp; Patient Campaign Day Tracking</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddDoctor}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-teal-500/40 text-teal-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus size={14} /> Add Doctor Row
          </button>

          <button
            onClick={handleAddPatient}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus size={14} /> Add Patient Row
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save Data'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 🌟 TABLE 1: DOCTOR CAMPAIGN & 12-MONTH PRESCRIPTION GENERATED */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope size={14} /> Doctor Campaign &amp; Monthly Prescription Generated (Brand: LINAGET)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Product: LINAGET</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th className="p-2 text-center w-10">S.N.</th>
                <th className="p-2 min-w-[170px]">DR NAME</th>
                <th className="p-2 text-center w-24">HQ</th>
                <th className="p-2 text-center w-24">SPECIALITY</th>
                <th className="p-2 text-center w-28 text-teal-300">CAMP DATE</th>
                <th className="p-2 text-center w-28 text-amber-300">Rx IN CAMP</th>
                {MONTH_COLS.map(m => (
                  <th key={m.key} className="p-2 text-center w-16 text-cyan-300 font-bold">
                    {m.label}
                  </th>
                ))}
                <th className="p-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campDocs.map(doc => (
                <tr key={doc.sn} className="hover:bg-slate-900/60 transition">
                  <td className="p-2 text-center text-slate-500 font-mono">{doc.sn}</td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={doc.drName}
                      onChange={e => handleDocChange(doc.sn, 'drName', e.target.value)}
                      placeholder="Doctor Name"
                      className="w-full py-1 px-2 bg-slate-900 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-teal-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input type="text" value={doc.hq} onChange={e => handleDocChange(doc.sn, 'hq', e.target.value)} className="w-full py-1 bg-slate-900 border border-slate-800 text-center text-slate-300 rounded text-xs" />
                  </td>
                  <td className="p-1 text-center">
                    <input type="text" value={doc.speciality} onChange={e => handleDocChange(doc.sn, 'speciality', e.target.value)} className="w-full py-1 bg-slate-900 border border-slate-800 text-center text-slate-300 rounded text-xs" />
                  </td>
                  <td className="p-1 text-center">
                    <input type="text" value={doc.campDate} onChange={e => handleDocChange(doc.sn, 'campDate', e.target.value)} placeholder="e.g. 10-Jul" className="w-full py-1 bg-slate-900 border border-slate-800 text-center font-mono font-bold text-teal-300 rounded text-xs" />
                  </td>
                  <td className="p-1 text-center">
                    <input type="text" value={doc.rxInCamp} onChange={e => handleDocChange(doc.sn, 'rxInCamp', e.target.value)} placeholder="0" className="w-full py-1 bg-slate-900 border border-slate-800 text-center font-mono font-bold text-amber-300 rounded text-xs" />
                  </td>

                  {/* 12 Months Rx Generated */}
                  {MONTH_COLS.map(m => (
                    <td key={m.key} className="p-1 text-center">
                      <input
                        type="text"
                        value={(doc as any)[m.key] || ''}
                        onChange={e => handleDocChange(doc.sn, m.key as any, e.target.value)}
                        placeholder="-"
                        className="w-full py-1 bg-slate-900 border border-slate-800 text-center font-mono font-bold text-white rounded text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                  ))}

                  <td className="p-1 text-center">
                    <button onClick={() => handleDeleteDoctor(doc.sn)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 TABLE 2: PATIENT LEVEL DETAILS & STRIPS SOLD ON CAMPAIGN DAY */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} /> Patient Level Details (Strips Sold on Campaign Day)
          </h3>
          <div className="text-xs font-bold text-emerald-400 font-mono">
            Total Strips Sold: {totalStripsSold} Strips
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th className="p-2.5 text-center w-12">S. NO.</th>
                <th className="p-2.5 min-w-[200px]">PATIENT NAME</th>
                <th className="p-2.5 min-w-[140px]">PHONE NO.</th>
                <th className="p-2.5 min-w-[140px] text-teal-300">BRAND PRESCRIBED</th>
                <th className="p-2.5 text-center min-w-[180px] text-emerald-400 bg-emerald-950/20">
                  NO. OF STRIPS SOLD ON CAMPAIGN DAY
                </th>
                <th className="p-2.5 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {patients.map(p => (
                <tr key={p.sn} className="hover:bg-slate-900/60 transition">
                  <td className="p-2 text-center text-slate-500 font-mono">{p.sn}</td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={p.patientName}
                      onChange={e => handlePatientChange(p.sn, 'patientName', e.target.value)}
                      placeholder="Patient Name"
                      className="w-full py-1.5 px-2 bg-slate-900 rounded-md font-semibold text-white text-xs border border-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={p.phoneNo}
                      onChange={e => handlePatientChange(p.sn, 'phoneNo', e.target.value)}
                      placeholder="Phone No"
                      className="w-full py-1.5 px-2 bg-slate-900 rounded-md font-mono text-slate-300 text-xs border border-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={p.brand}
                      onChange={e => handlePatientChange(p.sn, 'brand', e.target.value)}
                      placeholder="LINAGET"
                      className="w-full py-1.5 px-2 bg-slate-900 rounded-md font-bold text-teal-300 text-xs border border-slate-800 focus:border-blue-500 focus:outline-none uppercase"
                    />
                  </td>
                  <td className="p-1 text-center bg-emerald-950/10">
                    <input
                      type="text"
                      value={p.stripsSold}
                      onChange={e => handlePatientChange(p.sn, 'stripsSold', e.target.value)}
                      placeholder="0"
                      className="w-full py-1.5 px-2 bg-slate-900 rounded-md font-mono font-bold text-center text-emerald-400 text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <button onClick={() => handleDeletePatient(p.sn)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer Total */}
            <tfoot className="bg-slate-950 border-t-2 border-emerald-500/40 font-bold text-xs">
              <tr>
                <td colSpan={4} className="p-2.5 text-right text-white uppercase pr-4">
                  TOTAL STRIPS SOLD ON CAMPAIGN DAY:
                </td>
                <td className="p-2.5 text-center font-mono font-black text-sm text-emerald-300 bg-emerald-950/60">
                  {totalStripsSold} Strips
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
