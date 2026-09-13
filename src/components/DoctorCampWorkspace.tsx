import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Tent, Plus, Trash2, Check, X, Search, 
  Sparkles, Calendar, Clock, MapPin, Building2, 
  Stethoscope, MessageCircle, FileText, Download, 
  CheckCircle2, AlertTriangle, Users, DollarSign, Activity,
  Layers, Package, Share2, Printer, Copy
} from 'lucide-react';
import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from '../data/cboMasterDoctors';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { campStore, CampRecord, CampPatientEntry, CAMP_TYPES_PRESETS } from '../data/campStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

export const DoctorCampWorkspace: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'NEW_CAMP' | 'CAMP_HISTORY'>('NEW_CAMP');
  const [campsList, setCampsList] = useState<CampRecord[]>(() => campStore.getCamps());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState<CboDoctorMaster | null>(() => CBO_MASTER_130_DOCTORS[45] || null);
  const [doctorSearchText, setDoctorSearchText] = useState('');
  
  const [campTypeChoice, setCampTypeChoice] = useState<string>('HbA1c & Neuropathy Screening Camp');
  const [isCustomCampType, setIsCustomCampType] = useState(false);
  const [customCampTypeText, setCustomCampTypeText] = useState('');

  const [selectedFocusBrands, setSelectedFocusBrands] = useState<string[]>(['LINAGET-D TAB', 'PREMYLIN MSR TAB']);
  const [customBrandText, setCustomBrandText] = useState('');

  const [campDate, setCampDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/2026`;
  });
  const [campTime, setCampTime] = useState<string>('10:00 AM');
  const [clinicVenue, setClinicVenue] = useState<string>('Dungarpur Clinic');

  const [patients, setPatients] = useState<CampPatientEntry[]>([
    { id: 'p1', patientName: 'Ramesh Lal Sharma', ageGender: '54/M', testResult: 'HbA1c: 8.4%', brandPrescribed: 'LINAGET-D TAB', stripsSold: 2 },
    { id: 'p2', patientName: 'Mohan Lal Meena', ageGender: '48/M', testResult: 'VPT: High (Neuropathy)', brandPrescribed: 'PREMYLIN MSR TAB', stripsSold: 2 },
    { id: 'p3', patientName: 'Geeta Devi', ageGender: '60/F', testResult: 'RBS: 260 mg/dL', brandPrescribed: 'LINAGET-D TAB', stripsSold: 2 },
    { id: 'p4', patientName: 'Kanti Lal Soni', ageGender: '52/M', testResult: 'HbA1c: 7.9%', brandPrescribed: 'LINAGET-D TAB', stripsSold: 1 }
  ]);

  const [pobAmount, setPobAmount] = useState<string>('18500');
  const [pobChemist, setPobChemist] = useState<string>('Local Chemist');

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchText.trim()) return CBO_MASTER_130_DOCTORS.slice(0, 10);
    const q = doctorSearchText.toLowerCase();
    return CBO_MASTER_130_DOCTORS.filter(d => 
      d.doctorName.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q) || d.station.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [doctorSearchText]);

  const activeCampType = isCustomCampType ? (customCampTypeText || 'Custom Clinical Camp') : campTypeChoice;

  const handleAddPatientRow = () => {
    const defaultBrand = selectedFocusBrands[0] || 'LINAGET-D TAB';
    setPatients(prev => [
      ...prev,
      {
        id: 'p_' + Date.now(),
        patientName: '',
        ageGender: '',
        testResult: '',
        brandPrescribed: defaultBrand,
        stripsSold: 1
      }
    ]);
  };

  const handleUpdatePatient = (id: string, field: keyof CampPatientEntry, val: any) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleFocusBrand = (bName: string) => {
    if (selectedFocusBrands.includes(bName)) {
      if (selectedFocusBrands.length > 1) {
        setSelectedFocusBrands(selectedFocusBrands.filter(b => b !== bName));
      }
    } else {
      setSelectedFocusBrands([...selectedFocusBrands, bName]);
    }
  };

  const handleAddCustomBrand = () => {
    if (!customBrandText.trim()) return;
    const cleanB = customBrandText.trim().toUpperCase();
    if (!selectedFocusBrands.includes(cleanB)) {
      setSelectedFocusBrands([...selectedFocusBrands, cleanB]);
    }
    setCustomBrandText('');
  };

  const totalScreened = patients.filter(p => p.patientName.trim().length > 0).length || patients.length;
  const totalStrips = patients.reduce((acc, p) => acc + (Number(p.stripsSold) || 0), 0);
  const totalRx = patients.filter(p => p.brandPrescribed && p.brandPrescribed.trim().length > 0).length;

  const brandRxSummary = useMemo(() => {
    const map: Record<string, { rx: number; strips: number }> = {};
    patients.forEach(p => {
      const b = p.brandPrescribed || selectedFocusBrands[0] || 'Brand';
      if (!map[b]) map[b] = { rx: 0, strips: 0 };
      map[b].rx += 1;
      map[b].strips += Number(p.stripsSold) || 0;
    });
    return map;
  }, [patients, selectedFocusBrands]);

  const startingMessageText = useMemo(() => {
    const docName = selectedDoctor ? `Dr. ${selectedDoctor.doctorName} (${selectedDoctor.speciality})` : 'Doctor';
    const venue = clinicVenue || selectedDoctor?.clinicAddress || selectedDoctor?.station || 'Clinic';
    const brands = selectedFocusBrands.join(', ');

    return `🚩 *CAMP INITIATION UPDATE* 🚩\n\n👨‍⚕️ *Doctor:* ${docName}\n🏥 *Hospital/Clinic:* ${venue}\n🔬 *Camp Type:* ${activeCampType}\n🎯 *Focus Brands:* ${brands}\n📅 *Date & Time:* ${campDate} | ${campTime}`;
  }, [selectedDoctor, clinicVenue, activeCampType, selectedFocusBrands, campDate, campTime]);

  const finalClosureReportText = useMemo(() => {
    const docName = selectedDoctor ? `Dr. ${selectedDoctor.doctorName}` : 'Doctor';
    const venue = clinicVenue || selectedDoctor?.clinicAddress || selectedDoctor?.station || 'Clinic';

    const lines: string[] = [];
    lines.push(`🏆 *FINAL CAMP CLOSURE & ROI REPORT* 🏆\n`);
    lines.push(`👨‍⚕️ *Doctor Name:* ${docName}`);
    lines.push(`🏥 *Hospital/Clinic:* ${venue}`);
    lines.push(`🔬 *Camp Type:* ${activeCampType}`);
    lines.push(`📅 *Date:* ${campDate}\n`);
    lines.push(`📊 *CAMP DAY RESULTS:*`);
    lines.push(`• Total Patients Screened: ${totalScreened} Patients`);

    const entries = Object.entries(brandRxSummary);
    if (entries.length > 0) {
      const major = entries[0];
      lines.push(`• Major Focus Brand Rx: ${major[0]} (${major[1].rx} Rx | ${major[1].strips} Strips)`);

      if (entries.length > 1) {
        const others = entries.slice(1).map(([b, d]) => `${b} (${d.rx} Rx | ${d.strips} Strips)`).join(', ');
        lines.push(`• Other Brands Rx: ${others}`);
      }
    }

    lines.push(`• Total Prescriptions Generated on Camp Day: ${totalRx} Rx`);
    lines.push(`• Total Strips Sold/Billed on Camp Day: ${totalStrips} Strips`);

    const parsedPob = parseFloat(String(pobAmount || '0').replace(/,/g, '')) || 0;
    if (parsedPob > 0) {
      const chemistStr = pobChemist.trim() ? ` (${pobChemist.trim()})` : '';
      lines.push(`🛒 *POB Generated:* ₹${parsedPob.toLocaleString()}${chemistStr}`);
    }

    return lines.join('\n');
  }, [selectedDoctor, clinicVenue, activeCampType, campDate, totalScreened, brandRxSummary, totalRx, totalStrips, pobAmount, pobChemist]);

  const handleShareStartingWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(startingMessageText)}`;
    window.open(url, '_blank');
  };

  const handleShareFinalWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalClosureReportText)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 ${label} copied to clipboard!`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleSaveCampRecord = () => {
    if (!selectedDoctor) {
      alert("Kripya Doctor select karein!");
      return;
    }

    const newCamp: CampRecord = {
      id: 'camp_' + Date.now(),
      date: campDate,
      time: campTime,
      doctorName: selectedDoctor.doctorName,
      doctorSrNo: selectedDoctor.srNo,
      station: selectedDoctor.station,
      clinicVenue: clinicVenue || selectedDoctor.clinicAddress || selectedDoctor.station,
      campType: activeCampType,
      focusBrands: selectedFocusBrands,
      patients: JSON.parse(JSON.stringify(patients)),
      pobAmount: parseFloat(pobAmount) || 0,
      pobChemist: pobChemist.trim(),
      totalScreened,
      totalRxGenerated: totalRx,
      totalStripsSold: totalStrips,
      savedAt: new Date().toISOString()
    };

    campStore.saveCamp(newCamp);
    setCampsList(campStore.getCamps());
    setStatusMsg(`🎉 Camp Record for Dr. ${selectedDoctor.doctorName} successfully saved & archived!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const grandStats = useMemo(() => {
    let totCamps = campsList.length;
    let totScreened = campsList.reduce((acc, c) => acc + c.totalScreened, 0);
    let totRx = campsList.reduce((acc, c) => acc + c.totalRxGenerated, 0);
    let totPob = campsList.reduce((acc, c) => acc + (c.pobAmount || 0), 0);
    return { totCamps, totScreened, totRx, totPob };
  }, [campsList]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>

        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('NEW_CAMP')}
            className={`px-4 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'NEW_CAMP'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⛺ 1. Camp Creator &amp; Execution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CAMP_HISTORY')}
            className={`px-4 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'CAMP_HISTORY'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 2. Camp History Archive ({campsList.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <Tent size={24} />
            </span>
            Doctor Camp &amp; Clinical Activities Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            DDC, Neuropathy, HbA1c, BMD, Cardio Camps &bull; Live WhatsApp Senior Reports &bull; Sheet 1 &amp; 16 Auto-Sync
          </p>
        </div>
      </div>

      <CloudSyncBar
        storageKey="camps/clinical_activities_vault_v1"
        sheetTitle="Doctor Clinical Camps & Activities Vault"
        getData={() => ({ camps: campStore.getCamps() })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.camps && Array.isArray(cloudData.camps)) {
            cloudData.camps.forEach((c: CampRecord) => campStore.saveCamp(c));
            setCampsList(campStore.getCamps());
          }
        }}
        onSaveLocal={() => {
          campStore.persist();
        }}
      />

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Camps Archived</div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1">{grandStats.totCamps} Camps</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Auto-Reflected in Sheet 1 (Row 11)</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Total Patients Screened</div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">{grandStats.totScreened} Patients</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Clinical Detection Database</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Total Camp-Day Rx</div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{grandStats.totRx} Prescriptions</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Major Focus Brand Conversions</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL CAMP POB GENERATED</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            ₹{grandStats.totPob.toLocaleString()}
          </div>
        </div>
      </div>

      {activeTab === 'NEW_CAMP' && (
        <div className="space-y-5">
          {/* SECTION 1: CAMP SETUP */}
          <div className="p-5 bg-slate-900 rounded-3xl border-2 border-amber-500/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Stethoscope size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 1: Camp Setup &amp; Doctor Selection
                  </h2>
                  <p className="text-xs text-slate-400">Search doctor &bull; Choose Camp Category &bull; Send Starting WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>1. Pick Doctor from 130 MSL List:</span>
                  {selectedDoctor && (
                    <span className="text-amber-400 font-bold font-mono">
                      Selected: #{selectedDoctor.srNo} Dr. {selectedDoctor.doctorName}
                    </span>
                  )}
                </label>

                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Type doctor name, station..."
                    value={doctorSearchText}
                    onChange={e => setDoctorSearchText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="overflow-y-auto max-h-36 space-y-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                  {filteredDoctors.map(d => (
                    <div
                      key={d.srNo}
                      onClick={() => {
                        setSelectedDoctor(d);
                        setClinicVenue(d.clinicAddress || d.station);
                        setDoctorSearchText('');
                      }}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedDoctor?.srNo === d.srNo
                          ? 'bg-amber-950 border border-amber-500 text-white font-bold'
                          : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">#{d.srNo}</span>
                        <span className="font-bold text-white">Dr. {d.doctorName}</span>
                        <span className="text-[10px] text-cyan-300">({d.speciality})</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">{d.station}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">2. Camp Category / Type:</label>
                  <select
                    value={isCustomCampType ? 'CUSTOM' : campTypeChoice}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomCampType(true);
                      } else {
                        setIsCustomCampType(false);
                        setCampTypeChoice(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {CAMP_TYPES_PRESETS.map(preset => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                    <option value="CUSTOM">&bull; + Custom Camp Type &bull;</option>
                  </select>

                  {isCustomCampType && (
                    <input
                      type="text"
                      placeholder="Type custom camp name..."
                      value={customCampTypeText}
                      onChange={e => setCustomCampTypeText(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-500/60 text-cyan-300 font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none mt-1"
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Date:</label>
                    <input
                      type="text"
                      value={campDate}
                      onChange={e => setCampDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl px-2.5 py-1.5 text-center focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Time:</label>
                    <input
                      type="text"
                      value={campTime}
                      onChange={e => setCampTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold rounded-xl px-2.5 py-1.5 text-center focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Venue / Clinic:</label>
                    <input
                      type="text"
                      value={clinicVenue}
                      onChange={e => setClinicVenue(e.target.value)}
                      placeholder="Clinic Name"
                      className="w-full bg-slate-900 border border-slate-700 text-white font-medium rounded-xl px-2.5 py-1.5 focus:border-amber-400 focus:outline-none text-xs truncate"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Brands */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>3. Major Focus Brands:</span>
                <span className="text-cyan-400 font-mono font-bold">{selectedFocusBrands.join(', ')}</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {['LINAGET-D TAB', 'PREMYLIN MSR TAB', 'VALROS 10 TAB', 'VALROS F TAB', 'VINTEL CTC TAB', 'VINTEL 40 TAB', 'CITICURE PLUS TAB', 'CALGYM 60K CAPS', 'DIOSGLT 10 TAB'].map(b => {
                  const isSelected = selectedFocusBrands.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleToggleFocusBrand(b)}
                      className={`px-3 py-1 rounded-xl border font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{b}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Or type custom brand name..."
                  value={customBrandText}
                  onChange={e => setCustomBrandText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomBrand}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  + Add Brand
                </button>
              </div>
            </div>

            {/* Starting WhatsApp Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border-2 border-cyan-500/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-cyan-400 fill-cyan-400/20" />
                  Pre-Camp / Starting WhatsApp Message (Live Formatted):
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(startingMessageText, 'Starting Message')}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>

                  <button
                    type="button"
                    onClick={handleShareStartingWhatsApp}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <Share2 size={13} /> Send Starting WhatsApp
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap select-all">
                {startingMessageText}
              </div>
            </div>
          </div>

          {/* SECTION 2: LIVE PATIENT SCREENING ROSTER */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Users size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 2: Live Camp Day Patient Screening &amp; Rx Log
                  </h2>
                  <p className="text-xs text-slate-400">Log patient test values &bull; Prescribed Brand &bull; Same-day Strips sold</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPatientRow}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs shadow transition cursor-pointer"
              >
                <Plus size={14} /> + Add Patient Row
              </button>
            </div>

            <div className="overflow-x-auto max-h-[380px] border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 min-w-[180px]">Patient Name</th>
                    <th className="p-2.5 w-24 text-center">Age / Gender</th>
                    <th className="p-2.5 min-w-[160px] text-cyan-400">Clinical Test Value (HbA1c/VPT/RBS)</th>
                    <th className="p-2.5 min-w-[180px] text-amber-400">Brand Prescribed</th>
                    <th className="p-2.5 text-center w-28 text-emerald-400">Strips Billed (Day)</th>
                    <th className="p-2.5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {patients.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={p.patientName}
                          onChange={e => handleUpdatePatient(p.id, 'patientName', e.target.value)}
                          placeholder="Patient Name"
                          className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-white font-sans font-bold rounded-lg focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={p.ageGender || ''}
                          onChange={e => handleUpdatePatient(p.id, 'ageGender', e.target.value)}
                          placeholder="e.g. 52/M"
                          className="w-full py-1.5 px-1 bg-slate-950 border border-slate-800 text-slate-300 text-center rounded-lg focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={p.testResult}
                          onChange={e => handleUpdatePatient(p.id, 'testResult', e.target.value)}
                          placeholder="e.g. HbA1c: 8.6%, VPT High"
                          className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-lg focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={p.brandPrescribed}
                          onChange={e => handleUpdatePatient(p.id, 'brandPrescribed', e.target.value)}
                          className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-lg focus:outline-none cursor-pointer"
                        >
                          {selectedFocusBrands.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                          {MASTER_PRODUCTS.map(mp => (
                            <option key={mp.sn} value={mp.name}>{mp.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={p.stripsSold}
                          onChange={e => handleUpdatePatient(p.id, 'stripsSold', parseFloat(e.target.value) || 0)}
                          placeholder="1"
                          className="w-16 py-1.5 px-2 bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-center rounded-lg focus:outline-none mx-auto"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePatient(p.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: OPTIONAL POB ENTRY */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-amber-400" />
                  Optional POB Booking (Khali chhodne par report me hide ho jayega):
                </span>
                <span className="text-slate-500 font-mono">Optional Field</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-bold">POB Amount: ₹</span>
                  <input
                    type="number"
                    value={pobAmount}
                    onChange={e => setPobAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-emerald-400 font-mono font-bold focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-semibold">Chemist / Source:</span>
                  <input
                    type="text"
                    value={pobChemist}
                    onChange={e => setPobChemist(e.target.value)}
                    placeholder="e.g. Local Chemist / Vardhman"
                    className="w-full bg-transparent text-white focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: FINAL CAMP CLOSURE REPORT */}
          <div className="p-5 bg-slate-900 rounded-3xl border-2 border-emerald-500/60 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <MessageCircle size={20} className="fill-emerald-400/20" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 3: Final Camp Closure &amp; ROI Report (WhatsApp Format)
                  </h2>
                  <p className="text-xs text-slate-400">1-Click Share to WhatsApp &bull; POB auto-hides if empty &bull; Direct Save to Vault</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(finalClosureReportText, 'Final Report')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Copy size={13} /> Copy Text
                </button>

                <button
                  type="button"
                  onClick={handleShareFinalWhatsApp}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  <Share2 size={14} /> 💬 Send Final Report to WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleSaveCampRecord}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-950 flex items-center gap-1.5"
                >
                  <Check size={15} /> 💾 Save &amp; Archive Camp
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/40 font-mono text-xs text-slate-200 whitespace-pre-wrap select-all leading-relaxed shadow-inner">
              {finalClosureReportText}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMP HISTORY */}
      {activeTab === 'CAMP_HISTORY' && (
        <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Archived Clinical Camps ({campsList.length} Records)
              </h2>
              <p className="text-xs text-slate-400">All completed doctor camps &bull; Permanent Cloudflare KV store</p>
            </div>
          </div>

          {campsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No archived camps yet. Complete and save a camp from Tab 1 above!
            </div>
          ) : (
            <div className="space-y-3">
              {campsList.map((c, idx) => (
                <div key={c.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold font-mono">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white text-sm">Dr. {c.doctorName}</span>
                      <span className="text-xs text-cyan-300 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                        {c.campType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">📅 {c.date}</span>
                      <span className="text-amber-400">📍 {c.station}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete camp record for Dr. ${c.doctorName}?`)) {
                            campStore.deleteCamp(c.id);
                            setCampsList(campStore.getCamps());
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1 text-slate-300">
                    <div>Screened: <b className="text-cyan-300">{c.totalScreened}</b></div>
                    <div>Rx Generated: <b className="text-emerald-400">{c.totalRxGenerated}</b></div>
                    <div>Strips Sold: <b className="text-amber-300">{c.totalStripsSold}</b></div>
                    <div>POB: <b className="text-white">{c.pobAmount ? `₹${c.pobAmount.toLocaleString()}` : '-'}</b></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
