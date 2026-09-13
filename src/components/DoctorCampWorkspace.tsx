import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Tent, Plus, Trash2, Check, X, Search, 
  Sparkles, Calendar, Clock, MapPin, Building2, 
  Stethoscope, MessageCircle, FileText, Download, 
  CheckCircle2, AlertTriangle, Users, DollarSign, Activity,
  Layers, Package, Share2, Printer, Copy, Edit3, ShoppingBag
} from 'lucide-react';
import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from '../data/cboMasterDoctors';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { campStore, CampRecord, CampPatientEntry, CampPobItem, CAMP_TYPES_PRESETS } from '../data/campStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

const DURATION_PRESETS = [
  { label: '15 Days (1 Strip)', text: '15 Days', strips: 1 },
  { label: '1 Month (2 Strips)', text: '1 Month', strips: 2 },
  { label: '2 Months (4 Strips)', text: '2 Months', strips: 4 },
  { label: '3 Months (6 Strips)', text: '3 Months', strips: 6 },
];

export const DoctorCampWorkspace: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'NEW_CAMP' | 'CAMP_HISTORY'>('NEW_CAMP');
  const [campsList, setCampsList] = useState<CampRecord[]>(() => campStore.getCamps());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // --- FORM STATE ---
  const [selectedDoctor, setSelectedDoctor] = useState<CboDoctorMaster | null>(() => CBO_MASTER_130_DOCTORS[45] || null);
  const [doctorSearchText, setDoctorSearchText] = useState('');
  
  const [campTypeChoice, setCampTypeChoice] = useState<string>('HbA1c & Neuropathy Screening Camp');
  const [isCustomCampType, setIsCustomCampType] = useState(false);
  const [customCampTypeText, setCustomCampTypeText] = useState('');

  // 🌟 BRAND RANGE BUNDLES STATE
  const [selectedFocusBrands, setSelectedFocusBrands] = useState<string[]>(['LINAGET-D TAB', 'PREMYLIN MSR TAB']);
  const [productSearchText, setProductSearchText] = useState('');

  const [campDate, setCampDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/2026`;
  });

  // ⏰ TIME & ANALOG CLOCK MODAL STATE
  const [campTime, setCampTime] = useState<string>('10:00 AM');
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockMode, setClockMode] = useState<'HOUR' | 'MINUTE'>('HOUR');
  const [clockHour, setClockHour] = useState<number>(10);
  const [clockMinute, setClockMinute] = useState<number>(0);
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('AM');
  const clockDialRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingClock, setIsDraggingClock] = useState(false);

  // 🏥 VENUE / CLINIC MANUAL EDIT STATE
  const [clinicVenue, setClinicVenue] = useState<string>('Dungarpur Clinic');

  // 📝 PATIENTS ROSTER (WITH DURATION & STRIPS)
  const [patients, setPatients] = useState<CampPatientEntry[]>([
    { id: 'p1', patientName: 'Ramesh Lal Sharma', ageGender: '54/M', testResult: 'HbA1c: 8.4%', brandPrescribed: 'LINAGET-D TAB', prescribedDuration: '1 Month', stripsCount: 2 },
    { id: 'p2', patientName: 'Mohan Lal Meena', ageGender: '48/M', testResult: 'VPT: High (Neuropathy)', brandPrescribed: 'PREMYLIN MSR TAB', prescribedDuration: '1 Month', stripsCount: 2 },
    { id: 'p3', patientName: 'Geeta Devi', ageGender: '60/F', testResult: 'RBS: 260 mg/dL', brandPrescribed: 'LINAGET-D TAB', prescribedDuration: '1 Month', stripsCount: 2 },
    { id: 'p4', patientName: 'Kanti Lal Soni', ageGender: '52/M', testResult: 'HbA1c: 7.9%', brandPrescribed: 'LINAGET-D TAB', prescribedDuration: '15 Days', stripsCount: 1 }
  ]);

  // 🛒 PRODUCT-WISE POB BOOKING (BOXES & STRIPS)
  const [pobItems, setPobItems] = useState<CampPobItem[]>([
    { id: 'pob1', productName: 'LINAGET-D TAB', boxes: 2, strips: 20 },
    { id: 'pob2', productName: 'PREMYLIN MSR TAB', boxes: 1, strips: 10 }
  ]);
  const [pobChemist, setPobChemist] = useState<string>('Local Chemist');
  const [selectedPobProduct, setSelectedPobProduct] = useState<string>('VALROS 10 TAB');
  const [newPobBoxes, setNewPobBoxes] = useState<number>(1);
  const [newPobStrips, setNewPobStrips] = useState<number>(10);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    if (!doctorSearchText.trim()) return CBO_MASTER_130_DOCTORS.slice(0, 10);
    const q = doctorSearchText.toLowerCase();
    return CBO_MASTER_130_DOCTORS.filter(d => 
      d.doctorName.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q) || d.station.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [doctorSearchText]);

  // Filtered Master Products for Search
  const filteredMasterProducts = useMemo(() => {
    if (!productSearchText.trim()) return [];
    const q = productSearchText.toLowerCase();
    return MASTER_PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || String(p.sn).includes(q)).slice(0, 8);
  }, [productSearchText]);

  const activeCampType = isCustomCampType ? (customCampTypeText || 'Custom Clinical Camp') : campTypeChoice;

  // 🌟 BRAND RANGE BUNDLE SELECTORS
  const handleSelectBrandRange = (familyPrefix: string) => {
    const matching = MASTER_PRODUCTS
      .filter(p => p.name.toUpperCase().includes(familyPrefix.toUpperCase()))
      .map(p => p.name);

    // Merge without duplicates
    const combined = Array.from(new Set([...selectedFocusBrands, ...matching]));
    setSelectedFocusBrands(combined);
    setStatusMsg(`🎉 ${familyPrefix} Range ke saare SKUs focus brands me add ho gaye!`);
    setTimeout(() => setStatusMsg(null), 2500);
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

  // Add Patient Row
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
        prescribedDuration: '1 Month',
        stripsCount: 2
      }
    ]);
  };

  const handleUpdatePatient = (id: string, field: keyof CampPatientEntry, val: any) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  // POB Handlers
  const handleAddPobItem = () => {
    if (!selectedPobProduct) return;
    const item: CampPobItem = {
      id: 'pob_' + Date.now(),
      productName: selectedPobProduct,
      boxes: Number(newPobBoxes) || 1,
      strips: Number(newPobStrips) || 10
    };
    setPobItems(prev => [...prev, item]);
  };

  const handleDeletePobItem = (id: string) => {
    setPobItems(prev => prev.filter(it => it.id !== id));
  };

  // Clock Hand Angles
  const hourAngle = ((clockHour % 12) + clockMinute / 60) * 30;
  const minuteAngle = clockMinute * 6;
  const activeAngle = clockMode === 'HOUR' ? (clockHour % 12) * 30 : minuteAngle;
  const arcLength = 660;
  const clockProgress = (activeAngle / 360) * arcLength;

  const handleRotateDial = (clientX: number, clientY: number) => {
    if (!clockDialRef.current) return;
    const rect = clockDialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    if (clockMode === 'HOUR') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      setClockHour(h);
    } else {
      let m = Math.round(deg / 6);
      if (m === 60) m = 0;
      setClockMinute(m);
    }
  };

  const handleSaveClockTime = () => {
    const formatted = `${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')} ${clockPeriod}`;
    setCampTime(formatted);
    setShowClockModal(false);
  };

  // Calculations
  const totalScreened = patients.filter(p => p.patientName.trim().length > 0).length || patients.length;
  const totalStrips = patients.reduce((acc, p) => acc + (Number(p.stripsCount) || 0), 0);
  const totalRx = patients.filter(p => p.brandPrescribed && p.brandPrescribed.trim().length > 0).length;

  const brandRxSummary = useMemo(() => {
    const map: Record<string, { rx: number; strips: number; durations: Set<string> }> = {};
    patients.forEach(p => {
      const b = p.brandPrescribed || selectedFocusBrands[0] || 'Brand';
      if (!map[b]) map[b] = { rx: 0, strips: 0, durations: new Set() };
      map[b].rx += 1;
      map[b].strips += Number(p.stripsCount) || 0;
      if (p.prescribedDuration) map[b].durations.add(p.prescribedDuration);
    });
    return map;
  }, [patients, selectedFocusBrands]);

  // 🌟 1. STARTING WHATSAPP MESSAGE FORMAT
  const startingMessageText = useMemo(() => {
    const docName = selectedDoctor ? `Dr. ${selectedDoctor.doctorName} (${selectedDoctor.speciality})` : 'Doctor';
    const venue = clinicVenue || selectedDoctor?.clinicAddress || selectedDoctor?.station || 'Clinic';
    const brands = selectedFocusBrands.join(', ');

    return `🚩 *CAMP INITIATION UPDATE* 🚩\n\n👨‍⚕️ *Doctor:* ${docName}\n🏥 *Hospital/Clinic:* ${venue}\n🔬 *Camp Type:* ${activeCampType}\n🎯 *Focus Brands:* ${brands}\n📅 *Date & Time:* ${campDate} | ${campTime}`;
  }, [selectedDoctor, clinicVenue, activeCampType, selectedFocusBrands, campDate, campTime]);

  // 🌟 2. FINAL CLOSURE & ROI WHATSAPP REPORT (WITH ITEM-WISE POB & DURATION)
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

    // Focus Brand Breakdown
    const entries = Object.entries(brandRxSummary);
    if (entries.length > 0) {
      const major = entries[0];
      const durList = Array.from(major[1].durations).join(', ') || '1 Month';
      lines.push(`• Major Focus Brand Rx: ${major[0]} (${major[1].rx} Rx | Prescribed for ${durList} | ${major[1].strips} Strips)`);

      if (entries.length > 1) {
        const others = entries.slice(1).map(([b, d]) => `${b} (${d.rx} Rx | ${d.strips} Strips)`).join(', ');
        lines.push(`• Other Brands Rx: ${others}`);
      }
    }

    lines.push(`• Total Prescriptions Generated on Camp Day: ${totalRx} Rx`);
    lines.push(`• Total Strips Prescribed / Billed: ${totalStrips} Strips`);

    // 🌟 POB ITEM-WISE BREAKDOWN (ONLY APPEARS IF POB ITEMS EXIST)
    if (pobItems.length > 0) {
      const pobLines = pobItems.map(it => `${it.productName} (${it.boxes} Box / ${it.strips} Strips)`).join(', ');
      const chemistStr = pobChemist.trim() ? ` (From ${pobChemist.trim()})` : '';
      lines.push(`🛒 *POB Generated:* ${pobLines}${chemistStr}`);
    }

    return lines.join('\n');
  }, [selectedDoctor, clinicVenue, activeCampType, campDate, totalScreened, brandRxSummary, totalRx, totalStrips, pobItems, pobChemist]);

  const handleShareStartingWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(startingMessageText)}`, '_blank');
  };

  const handleShareFinalWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(finalClosureReportText)}`, '_blank');
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
      clinicVenue: clinicVenue.trim(),
      campType: activeCampType,
      focusBrands: selectedFocusBrands,
      patients: JSON.parse(JSON.stringify(patients)),
      pobItems: JSON.parse(JSON.stringify(pobItems)),
      pobChemist: pobChemist.trim(),
      totalScreened,
      totalRxGenerated: totalRx,
      totalStripsPrescribed: totalStrips,
      savedAt: new Date().toISOString()
    };

    campStore.saveCamp(newCamp);
    setCampsList(campStore.getCamps());
    setStatusMsg(`🎉 Camp Record for Dr. ${selectedDoctor.doctorName} saved & archived in Vault!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* 1. TOP NAVBAR */}
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

      {/* 2. HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <Tent size={24} />
            </span>
            Doctor Camp &amp; Clinical Activities Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Manual Venue &bull; Touch Clock Timing &bull; Brand Range Bundles &bull; Patient Duration &bull; Product-Wise POB
          </p>
        </div>
      </div>

      <CloudSyncBar
        storageKey="camps/clinical_activities_vault_v2"
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

      {activeTab === 'NEW_CAMP' && (
        <div className="space-y-5">
          
          {/* STEP 1: SETUP & INITIATION */}
          <div className="p-5 bg-slate-900 rounded-3xl border-2 border-amber-500/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Stethoscope size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 1: Camp Setup &amp; Doctor Timing
                  </h2>
                  <p className="text-xs text-slate-400">Doctor Search &bull; Manual Venue &bull; Interactive Touch Clock &bull; Focus Brand Bundles</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              
              {/* Doctor Search */}
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
                    placeholder="Search doctor name, station..."
                    value={doctorSearchText}
                    onChange={e => setDoctorSearchText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="overflow-y-auto max-h-32 space-y-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
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

              {/* Camp Type & Venue / Analog Touch Clock */}
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">2. Camp Category / Type:</label>
                  <select
                    value={isCustomCampType ? 'CUSTOM' : campTypeChoice}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') setIsCustomCampType(true);
                      else { setIsCustomCampType(false); setCampTypeChoice(e.target.value); }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {CAMP_TYPES_PRESETS.map(preset => <option key={preset} value={preset}>{preset}</option>)}
                    <option value="CUSTOM">&bull; + Custom Camp Type &bull;</option>
                  </select>

                  {isCustomCampType && (
                    <input
                      type="text"
                      placeholder="Type custom camp name..."
                      value={customCampTypeText}
                      onChange={e => setCustomCampTypeText(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-500/60 text-cyan-300 font-bold rounded-xl px-3 py-1 text-xs focus:outline-none mt-1"
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
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl px-2 py-1.5 text-center focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>

                  {/* ⏰ TOUCH CLOCK DIALOG TRIGGER BUTTON */}
                  <div>
                    <label className="text-[11px] text-purple-300 font-bold mb-1 block">⏰ Time (Ghadi):</label>
                    <button
                      type="button"
                      onClick={() => setShowClockModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 border border-purple-500/60 text-purple-300 hover:text-white font-mono font-bold rounded-xl px-2 py-1.5 text-xs transition cursor-pointer shadow-sm"
                      title="Tap to open analog clock with Ghanta & Minute Kanta"
                    >
                      <Clock size={13} className="text-purple-400" />
                      <span>{campTime}</span>
                    </button>
                  </div>

                  {/* 🏥 MANUAL EDITABLE VENUE / CLINIC */}
                  <div>
                    <label className="text-[11px] text-amber-300 font-bold mb-1 block flex items-center gap-1">
                      <Edit3 size={11} /> Venue / Clinic:
                    </label>
                    <input
                      type="text"
                      value={clinicVenue}
                      onChange={e => setClinicVenue(e.target.value)}
                      placeholder="Type Venue..."
                      className="w-full bg-slate-900 border border-slate-700 text-white font-medium rounded-xl px-2.5 py-1.5 focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 3. MAJOR FOCUS BRANDS WITH 1-CLICK RANGE BUNDLES */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-slate-300 font-bold">
                  3. Major Focus Brands:
                </label>
                <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                  <span className="text-slate-500 mr-1">Bundles:</span>
                  <button type="button" onClick={() => handleSelectBrandRange('VINTEL')} className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 rounded-md font-bold">⚡ VINTEL (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('VALROS')} className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-md font-bold">⚡ VALROS (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('LINAGET')} className="px-2 py-0.5 bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-500/40 rounded-md font-bold">⚡ LINAGET (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('PREMYLIN')} className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 rounded-md font-bold">⚡ PREMYLIN (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('VID')} className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded-md font-bold">⚡ VIDGLIT/VIDMET</button>
                </div>
              </div>

              {/* Active Selected Brand Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                {selectedFocusBrands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                    <span>{b}</span>
                    <button type="button" onClick={() => handleToggleFocusBrand(b)} className="hover:text-rose-400"><X size={12} /></button>
                  </span>
                ))}
              </div>

              {/* Search any product from 73 SKUs */}
              <div className="relative pt-1">
                <input
                  type="text"
                  placeholder="Search & Add any of the 73 SKUs to Focus Brands..."
                  value={productSearchText}
                  onChange={e => setProductSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none"
                />

                {filteredMasterProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border-2 border-cyan-500/60 rounded-xl shadow-2xl p-1 z-50 max-h-36 overflow-y-auto space-y-1">
                    {filteredMasterProducts.map(mp => (
                      <div
                        key={mp.sn}
                        onClick={() => {
                          if (!selectedFocusBrands.includes(mp.name)) setSelectedFocusBrands([...selectedFocusBrands, mp.name]);
                          setProductSearchText('');
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-cyan-950/70 text-xs text-white font-bold cursor-pointer flex justify-between"
                      >
                        <span>{mp.name}</span>
                        <span className="text-cyan-400 text-[10px]">+ Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Starting WhatsApp Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border-2 border-cyan-500/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-cyan-400 fill-cyan-400/20" />
                  Pre-Camp / Starting WhatsApp Message:
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

          {/* STEP 2: ADVANCED PATIENT DETAILS & PRESCRIPTION DURATION */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Users size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 2: Patient Screening &amp; Doctor Prescription Duration
                  </h2>
                  <p className="text-xs text-slate-400">Clinical test &bull; Default Focus Brand (Editable) &bull; Doctor Prescribed For (Days / Month)</p>
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
                    <th className="p-2.5 min-w-[170px]">Patient Name</th>
                    <th className="p-2.5 w-24 text-center">Age / Gender</th>
                    <th className="p-2.5 min-w-[160px] text-cyan-400">Clinical Test Value</th>
                    <th className="p-2.5 min-w-[180px] text-amber-400">Brand Prescribed</th>
                    <th className="p-2.5 min-w-[160px] text-purple-300">Doctor Prescribed For</th>
                    <th className="p-2.5 text-center w-24 text-emerald-400">Strips</th>
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
                          placeholder="52/M"
                          className="w-full py-1.5 px-1 bg-slate-950 border border-slate-800 text-slate-300 text-center rounded-lg focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={p.testResult}
                          onChange={e => handleUpdatePatient(p.id, 'testResult', e.target.value)}
                          placeholder="HbA1c: 8.4%, VPT High"
                          className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-lg focus:outline-none"
                        />
                      </td>

                      {/* BRAND PRESCRIBED: DEFAULTS TO MAIN FOCUS BRAND, EDITABLE */}
                      <td className="p-1">
                        <select
                          value={p.brandPrescribed}
                          onChange={e => handleUpdatePatient(p.id, 'brandPrescribed', e.target.value)}
                          className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-lg focus:outline-none cursor-pointer"
                        >
                          {selectedFocusBrands.map(b => <option key={b} value={b}>{b}</option>)}
                          {MASTER_PRODUCTS.map(mp => <option key={mp.sn} value={mp.name}>{mp.name}</option>)}
                        </select>
                      </td>

                      {/* DOCTOR PRESCRIBED FOR: (DURATION SELECTION) */}
                      <td className="p-1">
                        <select
                          value={p.prescribedDuration}
                          onChange={e => {
                            const dObj = DURATION_PRESETS.find(dp => dp.text === e.target.value);
                            handleUpdatePatient(p.id, 'prescribedDuration', e.target.value);
                            if (dObj) handleUpdatePatient(p.id, 'stripsCount', dObj.strips);
                          }}
                          className="w-full py-1.5 px-2 bg-slate-950 border border-purple-500/40 text-purple-300 font-bold rounded-lg focus:outline-none cursor-pointer"
                        >
                          {DURATION_PRESETS.map(dp => <option key={dp.text} value={dp.text}>{dp.label}</option>)}
                          <option value="Custom">Custom Days...</option>
                        </select>
                      </td>

                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={p.stripsCount}
                          onChange={e => handleUpdatePatient(p.id, 'stripsCount', parseFloat(e.target.value) || 0)}
                          placeholder="2"
                          className="w-14 py-1.5 px-1 bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-center rounded-lg focus:outline-none mx-auto"
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

            {/* 🌟 STEP 3: OPTIONAL PRODUCT-WISE POB BOOKING (BOXES & STRIPS) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={15} className="text-amber-400" />
                  Optional POB Booking (Product &bull; Boxes / Strips):
                </span>
                <span className="text-slate-500 font-mono text-[10px]">Auto-Hides from WhatsApp report if empty</span>
              </div>

              {/* Add POB Item Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-700">
                <select
                  value={selectedPobProduct}
                  onChange={e => setSelectedPobProduct(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white font-bold rounded-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                >
                  {selectedFocusBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  {MASTER_PRODUCTS.map(mp => <option key={mp.sn} value={mp.name}>{mp.name}</option>)}
                </select>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400">Boxes:</span>
                  <input
                    type="number"
                    value={newPobBoxes}
                    onChange={e => setNewPobBoxes(parseFloat(e.target.value) || 0)}
                    className="w-12 bg-transparent text-amber-300 font-mono font-bold text-center focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400">Strips:</span>
                  <input
                    type="number"
                    value={newPobStrips}
                    onChange={e => setNewPobStrips(parseFloat(e.target.value) || 0)}
                    className="w-12 bg-transparent text-emerald-400 font-mono font-bold text-center focus:outline-none"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Chemist Name (e.g. Vardhman / Local)..."
                  value={pobChemist}
                  onChange={e => setPobChemist(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleAddPobItem}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus size={13} /> Add POB
                </button>
              </div>

              {/* Active POB Chips List */}
              {pobItems.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {pobItems.map(it => (
                    <div key={it.id} className="p-2 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center gap-2">
                      <span className="font-bold text-white">{it.productName}:</span>
                      <span className="text-amber-300 font-mono font-bold">{it.boxes} Box ({it.strips} Strips)</span>
                      <button type="button" onClick={() => handleDeletePobItem(it.id)} className="text-slate-500 hover:text-rose-400"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: FINAL CAMP CLOSURE REPORT */}
          <div className="p-5 bg-slate-900 rounded-3xl border-2 border-emerald-500/60 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <MessageCircle size={20} className="fill-emerald-400/20" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 4: Final Camp Closure &amp; ROI WhatsApp Report
                  </h2>
                  <p className="text-xs text-slate-400">1-Click WhatsApp send &bull; Itemized POB auto-hides if empty &bull; Direct Save to Vault</p>
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

      {/* TAB 2: ARCHIVE */}
      {activeTab === 'CAMP_HISTORY' && (
        <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
            Archived Clinical Camps ({campsList.length} Records)
          </h2>

          {campsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No archived camps yet. Complete and save a camp from Tab 1 above!
            </div>
          ) : (
            <div className="space-y-3">
              {campsList.map((c, idx) => (
                <div key={c.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold font-mono">#{idx + 1}</span>
                      <span className="font-bold text-white text-sm">Dr. {c.doctorName}</span>
                      <span className="text-xs text-cyan-300 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">{c.campType}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">📅 {c.date}</span>
                      <span className="text-amber-400">📍 {c.station} ({c.clinicVenue})</span>
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono pt-1 text-slate-300">
                    <div>Screened: <b className="text-cyan-300">{c.totalScreened} Patients</b></div>
                    <div>Rx Generated: <b className="text-emerald-400">{c.totalRxGenerated} Rx</b></div>
                    <div>Strips Prescribed: <b className="text-amber-300">{c.totalStripsPrescribed || c.totalStripsSold} Strips</b></div>
                    <div>POB: <b className="text-white">{c.pobItems && c.pobItems.length > 0 ? `${c.pobItems.length} SKUs (${c.pobChemist || 'Chemist'})` : '-'}</b></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⏰ TOUCH CLOCK MODAL FOR CAMP TIMING */}
      {showClockModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900 tracking-wide">
                  Set Camp Timing (Touch Clock)
                </h3>
              </div>
              <button onClick={() => setShowClockModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setClockMode('HOUR')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  clockMode === 'HOUR' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                ⏰ Ghanta Hand ({clockHour})
              </button>
              <button
                type="button"
                onClick={() => setClockMode('MINUTE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  clockMode === 'MINUTE' ? 'bg-[#EC4899] text-white border-[#EC4899] shadow' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                ⏱️ Minute Hand (Chhota Kanta: {clockMinute}m)
              </button>
            </div>

            <div className="flex flex-col items-center justify-center select-none">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg
                  ref={clockDialRef}
                  viewBox="0 0 260 260"
                  className="w-56 h-56 cursor-pointer touch-none"
                  onMouseDown={() => setIsDraggingClock(true)}
                  onMouseUp={() => setIsDraggingClock(false)}
                  onMouseMove={(e) => isDraggingClock && handleRotateDial(e.clientX, e.clientY)}
                  onTouchStart={() => setIsDraggingClock(true)}
                  onTouchEnd={() => setIsDraggingClock(false)}
                  onTouchMove={(e) => isDraggingClock && handleRotateDial(e.touches[0].clientX, e.touches[0].clientY)}
                  onClick={(e) => handleRotateDial(e.clientX, e.clientY)}
                >
                  <circle cx="130" cy="130" r="105" fill="none" stroke="#F1F5F9" strokeWidth="20" />
                  <circle
                    cx="130"
                    cy="130"
                    r="105"
                    fill="none"
                    stroke={clockMode === 'HOUR' ? '#8B5CF6' : '#EC4899'}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={arcLength - clockProgress}
                    transform="rotate(-90 130 130)"
                  />
                  <circle cx="130" cy="130" r="92" fill="#FFFFFF" />

                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x = 130 + 72 * Math.sin(angle);
                    const y = 130 - 72 * Math.cos(angle);
                    const isKeyNumber = [12, 3, 6, 9].includes(h);

                    return (
                      <text
                        key={h}
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize={isKeyNumber ? "13" : "11"}
                        fontWeight={isKeyNumber ? "bold" : "normal"}
                        fill={isKeyNumber ? "#8B5CF6" : "#64748B"}
                      >
                        {h}
                      </text>
                    );
                  })}

                  <line
                    x1="130"
                    y1="130"
                    x2={130 + 48 * Math.sin(hourAngle * (Math.PI / 180))}
                    y2={130 - 48 * Math.cos(hourAngle * (Math.PI / 180))}
                    stroke="#8B5CF6"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="130"
                    y1="130"
                    x2={130 + 68 * Math.sin(minuteAngle * (Math.PI / 180))}
                    y2={130 - 68 * Math.cos(minuteAngle * (Math.PI / 180))}
                    stroke="#EC4899"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="130" cy="130" r="5" fill="#1E293B" />
                </svg>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-black font-mono text-slate-800 tracking-tight">
                  {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClockPeriod('AM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      clockPeriod === 'AM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setClockPeriod('PM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      clockPeriod === 'PM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveClockTime}
                className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={16} /> SET CAMP TIME
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
