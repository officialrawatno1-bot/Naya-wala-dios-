import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Tent, Plus, Trash2, Check, X, Search, 
  Sparkles, Calendar, Clock, MapPin, Building2, 
  Stethoscope, MessageCircle, FileText, Download, 
  CheckCircle2, AlertTriangle, Users, DollarSign, Activity,
  Layers, Package, Share2, Printer, Copy, Edit3, ShoppingBag,
  Zap, Phone, UserCheck, Baby, ChevronRight
} from 'lucide-react';
import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from '../data/cboMasterDoctors';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { campStore, CampRecord, CampPatientEntry, CampPobItem, CAMP_TYPES_PRESETS } from '../data/campStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

const DURATION_PRESETS = [
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months'
];

const getPackQuantity = (brandName: string): number => {
  const mp = MASTER_PRODUCTS.find(p => p.name.toUpperCase().trim() === brandName.toUpperCase().trim());
  if (!mp) return 10;
  const pack = (mp.pack || '').toUpperCase();
  if (pack.includes('15') || pack.includes('1X15') || pack.includes('15S') || pack.includes('15 TAB')) return 15;
  if (pack.includes('14') || pack.includes('1X14') || pack.includes('14S')) return 14;
  if (pack.includes('4') || pack.includes('1X4') || pack.includes('4S')) return 4;
  return 10;
};

const calculateStripsFromDuration = (brandName: string, duration: string): number => {
  const packSize = getPackQuantity(brandName);
  const isWeekly = packSize === 4;

  if (isWeekly) {
    if (duration === '15 Days') return 1;
    if (duration === '1 Month') return 1;
    if (duration === '2 Months') return 2;
    if (duration === '3 Months') return 3;
    return 1;
  }

  if (duration === '15 Days') return packSize === 15 ? 1 : 2;
  if (duration === '1 Month') return packSize === 15 ? 2 : (packSize === 14 ? 2 : 3);
  if (duration === '2 Months') return packSize === 15 ? 4 : (packSize === 14 ? 4 : 6);
  if (duration === '3 Months') return packSize === 15 ? 6 : (packSize === 14 ? 6 : 9);
  return 2;
};

const getCampTestPresets = (campType: string): string[] => {
  const ct = (campType || '').toUpperCase();
  if (ct.includes('NEURO') || ct.includes('BIOTHESIO')) {
    return ['VPT: 26V (High Risk)', 'VPT: 32V (Severe Neuropathy)', 'VPT: 18V (Moderate)', 'Tuning Fork: Diminished', 'Burning Sensation (DN)'];
  }
  if (ct.includes('HBA1C') || ct.includes('PROGRESSION')) {
    return ['HbA1c: 8.4%', 'HbA1c: 9.2%', 'HbA1c: 7.8%', 'HbA1c: 10.5%', 'HbA1c: 8.9%'];
  }
  if (ct.includes('BMD') || ct.includes('BONE') || ct.includes('DENSITY')) {
    return ['T-Score: -2.8 (Osteoporosis)', 'T-Score: -1.9 (Osteopenia)', 'T-Score: -3.2 (Severe)', 'Z-Score: -2.2'];
  }
  if (ct.includes('CARDIO') || ct.includes('LIPID')) {
    return ['BP: 160/100 mmHg', 'Cholesterol: 240 mg/dL', 'Triglycerides: 280 mg/dL', 'LDL: 165 mg/dL'];
  }
  if (ct.includes('HYPER') || ct.includes('VASCULAR')) {
    return ['BP: 160/100 mmHg', 'BP: 150/95 mmHg', 'BP: 170/105 mmHg', 'Stage 2 HTN'];
  }
  return ['RBS: 240 mg/dL', 'RBS: 280 mg/dL', 'FBS: 155 mg/dL', 'PPBS: 230 mg/dL', 'RBS: 195 mg/dL'];
};

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
  const [productSearchText, setProductSearchText] = useState('');

  const [campDate, setCampDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/2026`;
  });

  const [campTime, setCampTime] = useState<string>('10:00 AM');
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockHour, setClockHour] = useState<number>(10);
  const [clockMinute, setClockMinute] = useState<number>(0);
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('AM');

  const [clinicVenue, setClinicVenue] = useState<string>('Dungarpur Clinic');

  // Patients Roster
  const [patients, setPatients] = useState<CampPatientEntry[]>([
    { id: 'p1', patientName: 'Ramesh Lal Sharma', mobileNumber: '9829012345', age: 54, gender: 'M', ageGender: '54/M', testResult: 'HbA1c: 8.4%', brandPrescribed: 'LINAGET-D TAB', prescribedDuration: '1 Month', stripsCount: 3 },
    { id: 'p2', patientName: 'Mohan Lal Meena', mobileNumber: '9414056789', age: 48, gender: 'M', ageGender: '48/M', testResult: 'VPT: 26V (High Risk)', brandPrescribed: 'PREMYLIN MSR TAB', prescribedDuration: '1 Month', stripsCount: 3 },
    { id: 'p3', patientName: 'Geeta Devi', mobileNumber: '', age: 60, gender: 'F', ageGender: '60/F', testResult: 'RBS: 260 mg/dL', brandPrescribed: 'LINAGET-D TAB', prescribedDuration: '1 Month', stripsCount: 3 }
  ]);

  // 🌟 DEDICATED POPUP SCREEN / MODAL STATE
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<{
    patientName: string;
    mobileNumber: string;
    age: number | string;
    gender: 'M' | 'F' | 'O';
    testResult: string;
    brandPrescribed: string;
    prescribedDuration: string;
    stripsCount: number;
  }>({
    patientName: '',
    mobileNumber: '',
    age: 50,
    gender: 'M',
    testResult: 'HbA1c: 8.4%',
    brandPrescribed: 'LINAGET-D TAB',
    prescribedDuration: '1 Month',
    stripsCount: 3
  });

  // POB
  const [pobItems, setPobItems] = useState<CampPobItem[]>([
    { id: 'pob1', productName: 'LINAGET-D TAB', boxes: 2, strips: 20 },
    { id: 'pob2', productName: 'PREMYLIN MSR TAB', boxes: 1, strips: 10 }
  ]);
  const [pobChemist, setPobChemist] = useState<string>('Local Chemist');
  const [selectedPobProduct, setSelectedPobProduct] = useState<string>('VALROS 10 TAB');
  const [newPobBoxes, setNewPobBoxes] = useState<number>(1);
  const [newPobStrips, setNewPobStrips] = useState<number>(10);

  const activeCampType = isCustomCampType ? (customCampTypeText || 'Custom Clinical Camp') : campTypeChoice;
  const currentTestPresets = useMemo(() => getCampTestPresets(activeCampType), [activeCampType]);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchText.trim()) return CBO_MASTER_130_DOCTORS.slice(0, 10);
    const q = doctorSearchText.toLowerCase();
    return CBO_MASTER_130_DOCTORS.filter(d => 
      d.doctorName.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q) || d.station.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [doctorSearchText]);

  const filteredMasterProducts = useMemo(() => {
    if (!productSearchText.trim()) return [];
    const q = productSearchText.toLowerCase();
    return MASTER_PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || String(p.sn).includes(q)).slice(0, 8);
  }, [productSearchText]);

  const handleSelectBrandRange = (familyPrefix: string) => {
    const matching = MASTER_PRODUCTS
      .filter(p => p.name.toUpperCase().includes(familyPrefix.toUpperCase()))
      .map(p => p.name);
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

  // Open Dedicated New Patient Modal
  const handleOpenNewPatientModal = () => {
    setEditingPatientId(null);
    const defaultBrand = selectedFocusBrands[0] || 'LINAGET-D TAB';
    const defaultDuration = '1 Month';
    const autoStrips = calculateStripsFromDuration(defaultBrand, defaultDuration);
    const autoTest = currentTestPresets[patients.length % currentTestPresets.length] || 'HbA1c: 8.4%';

    setPatientForm({
      patientName: '',
      mobileNumber: '',
      age: 50,
      gender: 'M',
      testResult: autoTest,
      brandPrescribed: defaultBrand,
      prescribedDuration: defaultDuration,
      stripsCount: autoStrips
    });
    setShowPatientModal(true);
  };

  const handleOpenEditPatientModal = (p: CampPatientEntry) => {
    setEditingPatientId(p.id);
    setPatientForm({
      patientName: p.patientName,
      mobileNumber: p.mobileNumber || '',
      age: p.age || 50,
      gender: p.gender || 'M',
      testResult: p.testResult,
      brandPrescribed: p.brandPrescribed,
      prescribedDuration: p.prescribedDuration,
      stripsCount: p.stripsCount
    });
    setShowPatientModal(true);
  };

  const handleSavePatientModal = () => {
    if (!patientForm.patientName.trim()) {
      alert("Kripya Patient ka Naam zaroor likhein!");
      return;
    }

    const ageNum = patientForm.age || 50;
    const genderVal = patientForm.gender || 'M';
    const ageGenderStr = `${ageNum}/${genderVal}`;

    if (editingPatientId) {
      setPatients(prev => prev.map(item => item.id === editingPatientId ? {
        ...item,
        patientName: patientForm.patientName.trim(),
        mobileNumber: patientForm.mobileNumber.trim(),
        age: ageNum,
        gender: genderVal,
        ageGender: ageGenderStr,
        testResult: patientForm.testResult.trim(),
        brandPrescribed: patientForm.brandPrescribed,
        prescribedDuration: patientForm.prescribedDuration,
        stripsCount: patientForm.stripsCount
      } : item));
      setStatusMsg(`🎉 Patient ${patientForm.patientName} updated!`);
    } else {
      const newEntry: CampPatientEntry = {
        id: 'p_' + Date.now(),
        patientName: patientForm.patientName.trim(),
        mobileNumber: patientForm.mobileNumber.trim(),
        age: ageNum,
        gender: genderVal,
        ageGender: ageGenderStr,
        testResult: patientForm.testResult.trim(),
        brandPrescribed: patientForm.brandPrescribed,
        prescribedDuration: patientForm.prescribedDuration,
        stripsCount: patientForm.stripsCount
      };
      setPatients(prev => [...prev, newEntry]);
      setStatusMsg(`🎉 Patient ${newEntry.patientName} added to roster!`);
    }

    setShowPatientModal(false);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

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
      const durList = Array.from(major[1].durations).join(', ') || '1 Month';
      lines.push(`• Major Focus Brand Rx: ${major[0]} (${major[1].rx} Rx | Prescribed for ${durList} | ${major[1].strips} Strips)`);

      if (entries.length > 1) {
        const others = entries.slice(1).map(([b, d]) => `${b} (${d.rx} Rx | ${d.strips} Strips)`).join(', ');
        lines.push(`• Other Brands Rx: ${others}`);
      }
    }

    lines.push(`• Total Prescriptions Generated on Camp Day: ${totalRx} Rx`);
    lines.push(`• Total Strips Prescribed / Billed: ${totalStrips} Strips`);

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
      
      {/* TOP NAVBAR */}
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

      {/* TITLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <Tent size={24} />
            </span>
            Doctor Camp &amp; Clinical Activities Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Dedicated Patient Entry Modal Screen &bull; Mobile No. &bull; 1-Click M/F Toggle &bull; Auto Pack Strips
          </p>
        </div>
      </div>

      <CloudSyncBar
        storageKey="camps/clinical_activities_vault_v3"
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
          
          {/* STEP 1: SETUP */}
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
                  <p className="text-xs text-slate-400">130 MSL Doctors &bull; Touch Clock &bull; Focus Brand Range Bundles</p>
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

              {/* Camp Type & Venue / Time */}
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
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl px-2.5 py-1.5 text-center focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-purple-300 font-bold mb-1 block">⏰ Time (Ghadi):</label>
                    <button
                      type="button"
                      onClick={() => setShowClockModal(true)}
                      className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 border border-purple-500/60 text-purple-300 hover:text-white font-mono font-bold rounded-xl px-2 py-1.5 text-xs transition cursor-pointer shadow-sm"
                    >
                      <Clock size={13} className="text-purple-400" />
                      <span>{campTime}</span>
                    </button>
                  </div>

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

            {/* Focus Brands */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-slate-300 font-bold">
                  3. Major Focus Brands:
                </label>
                <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                  <button type="button" onClick={() => handleSelectBrandRange('VINTEL')} className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 rounded-md font-bold">⚡ VINTEL (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('VALROS')} className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-md font-bold">⚡ VALROS (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('LINAGET')} className="px-2 py-0.5 bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-500/40 rounded-md font-bold">⚡ LINAGET (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('PREMYLIN')} className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 rounded-md font-bold">⚡ PREMYLIN (All Range)</button>
                  <button type="button" onClick={() => handleSelectBrandRange('VID')} className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded-md font-bold">⚡ VIDGLIT/VIDMET</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                {selectedFocusBrands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                    <span>{b}</span>
                    <button type="button" onClick={() => handleToggleFocusBrand(b)} className="hover:text-rose-400"><X size={12} /></button>
                  </span>
                ))}
              </div>

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

          {/* 🌟 STEP 2: PATIENT ROSTER (DEDICATED MODAL SCREEN TRIGGER) */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Users size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 2: Patient Screening Roster &bull; ({patients.length} Enrolled)
                  </h2>
                  <p className="text-xs text-slate-400">Click button to open dedicated Patient Entry Screen with Phone No., 1-Click M/F &amp; Pack Strips</p>
                </div>
              </div>

              {/* 🌟 DEDICATED SCREEN BUTTON */}
              <button
                type="button"
                onClick={handleOpenNewPatientModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95"
              >
                <Plus size={16} /> + Add New Patient (Open Screen)
              </button>
            </div>

            {/* Clean Patient Roster Table */}
            <div className="overflow-x-auto max-h-[420px] border border-slate-800 rounded-2xl shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3 min-w-[180px]">Patient Name</th>
                    <th className="p-3 min-w-[130px] text-slate-400">Mobile No.</th>
                    <th className="p-3 text-center w-24">Age / Gender</th>
                    <th className="p-3 min-w-[170px] text-cyan-400">Clinical Test Value</th>
                    <th className="p-3 min-w-[180px] text-amber-400">Brand Prescribed</th>
                    <th className="p-3 min-w-[140px] text-purple-300">Prescribed For</th>
                    <th className="p-3 text-center w-24 text-emerald-400">Strips</th>
                    <th className="p-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                        No patients enrolled yet. Click <b>"+ Add New Patient (Open Screen)"</b> above to add!
                      </td>
                    </tr>
                  ) : (
                    patients.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-sans font-bold text-white">{p.patientName}</td>
                        <td className="p-3 text-slate-300 font-mono">
                          {p.mobileNumber ? `📞 ${p.mobileNumber}` : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            (p.gender || 'M') === 'F' ? 'bg-pink-950 text-pink-300 border border-pink-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {p.ageGender || `${p.age}/${p.gender || 'M'}`}
                          </span>
                        </td>
                        <td className="p-3 text-cyan-300 font-semibold">{p.testResult}</td>
                        <td className="p-3 text-amber-300 font-bold">{p.brandPrescribed}</td>
                        <td className="p-3 text-purple-300 font-semibold">{p.prescribedDuration}</td>
                        <td className="p-3 text-center font-black text-emerald-400 bg-emerald-950/20">{p.stripsCount}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPatientModal(p)}
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg transition"
                              title="Edit Patient"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePatient(p.id)}
                              className="p-1.5 bg-slate-950 hover:bg-rose-950 border border-slate-700 text-rose-400 rounded-lg transition"
                              title="Delete Patient"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* STEP 3: OPTIONAL PRODUCT-WISE POB (BOXES & STRIPS) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={15} className="text-amber-400" />
                  Optional POB Booking (Product &bull; Boxes / Strips):
                </span>
                <span className="text-slate-500 font-mono text-[10px]">Auto-Hides from WhatsApp report if empty</span>
              </div>

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
                  placeholder="Chemist Name..."
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

          {/* STEP 4: FINAL CLOSURE REPORT */}
          <div className="p-5 bg-slate-900 rounded-3xl border-2 border-emerald-500/60 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <MessageCircle size={20} className="fill-emerald-400/20" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 3: Final Camp Closure &amp; ROI WhatsApp Report
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

      {/* 🌟 6. DEDICATED NEW / EDIT PATIENT ENTRY SCREEN MODAL */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Users size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPatientId ? 'Edit Patient Details' : 'Add New Patient Screening Entry'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Camp: <b className="text-cyan-300">{activeCampType.split(' ')[0]}</b> &bull; Doctor: Dr. {selectedDoctor?.doctorName || 'Doctor'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPatientModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="overflow-y-auto space-y-3.5 pr-1 text-xs">
              
              {/* Field 1: Patient Name & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Lal Sharma"
                    value={patientForm.patientName}
                    onChange={e => setPatientForm({ ...patientForm, patientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-cyan-400" /> Patient Mobile Number:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9829012345"
                    value={patientForm.mobileNumber}
                    onChange={e => setPatientForm({ ...patientForm, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Age & 1-Click Gender Toggle */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold">Age &amp; 1-Click Gender Selection:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">Age:</span>
                    <input
                      type="number"
                      value={patientForm.age}
                      onChange={e => setPatientForm({ ...patientForm, age: parseFloat(e.target.value) || 50 })}
                      className="w-16 bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-2.5 py-1.5 text-center text-xs"
                    />
                    <span className="text-slate-500">Yrs</span>
                  </div>

                  {/* Gender Buttons */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, gender: 'M' })}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 border ${
                        patientForm.gender === 'M'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      👦 Male (M)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, gender: 'F' })}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 border ${
                        patientForm.gender === 'F'
                          ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      👧 Female (F)
                    </button>
                  </div>
                </div>
              </div>

              {/* Field 3: Clinical Test Value */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-bold">
                    Clinical Test Reading ({activeCampType.split(' ')[0]}):
                  </label>
                  <span className="text-[10px] text-slate-400">Select preset or type custom</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentTestPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, testResult: preset })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold font-mono transition cursor-pointer ${
                        patientForm.testResult === preset
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or type custom test result (e.g. RBS: 235 mg/dL, HbA1c 8.8%)..."
                  value={patientForm.testResult}
                  onChange={e => setPatientForm({ ...patientForm, testResult: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Field 4: Brand Prescribed & Pack Size */}
              <div>
                <label className="block text-amber-300 font-bold mb-1">Brand Prescribed by Doctor:</label>
                <select
                  value={patientForm.brandPrescribed}
                  onChange={e => {
                    const newBrand = e.target.value;
                    const newStrips = calculateStripsFromDuration(newBrand, patientForm.prescribedDuration);
                    setPatientForm({ ...patientForm, brandPrescribed: newBrand, stripsCount: newStrips });
                  }}
                  className="w-full bg-slate-950 border border-amber-500/50 text-amber-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                >
                  <optgroup label="Camp Major Focus Brands">
                    {selectedFocusBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                  <optgroup label="All 73 Master Products">
                    {MASTER_PRODUCTS.map(mp => <option key={mp.sn} value={mp.name}>{mp.name}</option>)}
                  </optgroup>
                </select>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5 pl-1">
                  Pack Size: <b className="text-white">{getPackQuantity(patientForm.brandPrescribed)} Tabs/Caps</b>
                </span>
              </div>

              {/* Field 5: Prescribed Duration & Automatic Strips */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-purple-300 font-bold">Doctor Prescribed For (Duration):</label>
                  <span className="text-emerald-400 font-mono font-bold">
                    Auto-Calculated: {patientForm.stripsCount} Strips
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {DURATION_PRESETS.map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        const newStrips = calculateStripsFromDuration(patientForm.brandPrescribed, dur);
                        setPatientForm({ ...patientForm, prescribedDuration: dur, stripsCount: newStrips });
                      }}
                      className={`py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        patientForm.prescribedDuration === dur
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Total Strips to Bill / Dispense:</span>
                  <input
                    type="number"
                    value={patientForm.stripsCount}
                    onChange={e => setPatientForm({ ...patientForm, stripsCount: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-slate-900 border border-emerald-500/60 text-emerald-400 font-black font-mono text-center rounded-xl py-1 text-sm focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Will save permanently to camp roster</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSavePatientModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-950 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check size={16} /> Save Patient to Roster
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
