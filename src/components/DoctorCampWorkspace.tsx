import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Tent, Plus, Trash2, Check, X, Search, 
  Sparkles, Calendar, Clock, MapPin, Building2, 
  Stethoscope, MessageCircle, FileText, Download, 
  CheckCircle2, AlertTriangle, Users, DollarSign, Activity,
  Layers, Package, Share2, Printer, Copy, Edit3, ShoppingBag,
  Zap, Phone, UserCheck, Baby, ChevronRight, Calculator,
  Sliders, ArrowRightLeft, ShieldAlert
} from 'lucide-react';
import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from '../data/cboMasterDoctors';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { 
  campStore, 
  CampRecord, 
  CampPatientEntry, 
  CampPobItem, 
  CAMP_TYPES_PRESETS,
  ClinicalTestType,
  DosageFrequency,
  evaluateTestResult
} from '../data/campStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

const BASE_DURATION_OPTIONS = [
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '4 Months',
  '5 Months',
  '6 Months',
  '9 Months',
  '12 Months'
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

const calculateStripsFromDurationAndFreq = (brandName: string, durationStr: string, freq: DosageFrequency): number => {
  const packSize = getPackQuantity(brandName);
  const isWeekly = packSize === 4 || freq === 'WEEKLY';

  let days = 30;
  if (durationStr.includes('15 Days')) days = 15;
  else if (durationStr.includes('1 Month')) days = 30;
  else if (durationStr.includes('2 Month')) days = 60;
  else if (durationStr.includes('3 Month')) days = 90;
  else if (durationStr.includes('4 Month')) days = 120;
  else if (durationStr.includes('5 Month')) days = 150;
  else if (durationStr.includes('6 Month')) days = 180;
  else if (durationStr.includes('9 Month')) days = 270;
  else if (durationStr.includes('12 Month')) days = 365;
  else {
    const m = durationStr.match(/\d+/);
    if (m) {
      const num = parseInt(m[0]);
      days = durationStr.toLowerCase().includes('day') ? num : num * 30;
    }
  }

  if (isWeekly) {
    const weeks = Math.ceil(days / 7);
    return Math.ceil(weeks / 4);
  }

  const tabsPerDay = freq === 'TDS' ? 3 : freq === 'BD' ? 2 : 1;
  const totalTabs = days * tabsPerDay;
  return Math.ceil(totalTabs / packSize);
};

const calculateDurationFromStripsAndFreq = (brandName: string, strips: number, freq: DosageFrequency): string => {
  if (strips <= 0) return '15 Days';
  const packSize = getPackQuantity(brandName);
  const isWeekly = packSize === 4 || freq === 'WEEKLY';

  if (isWeekly) {
    const totalCaps = strips * 4;
    const months = Math.round(totalCaps / 4);
    return months <= 1 ? '1 Month' : `${months} Months`;
  }

  const tabsPerDay = freq === 'TDS' ? 3 : freq === 'BD' ? 2 : 1;
  const totalTabs = strips * packSize;
  const days = Math.round(totalTabs / tabsPerDay);
  const months = Math.round(days / 30);

  if (days <= 20) return '15 Days';
  if (months <= 1) return '1 Month';
  return `${months} Months`;
};

const getDefaultTestType = (campType: string): ClinicalTestType => {
  const ct = (campType || '').toUpperCase();
  if (ct.includes('NEURO') || ct.includes('BIOTHESIO')) return 'VPT';
  if (ct.includes('HBA1C') || ct.includes('PROGRESSION')) return 'HbA1c';
  if (ct.includes('BMD') || ct.includes('BONE') || ct.includes('DENSITY')) return 'BMD';
  if (ct.includes('CARDIO') || ct.includes('LIPID')) return 'RBS';
  if (ct.includes('HYPER') || ct.includes('VASCULAR')) return 'BP';
  return 'RBS';
};

export const DoctorCampWorkspace: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'NEW_CAMP' | 'CAMP_HISTORY'>('NEW_CAMP');
  const [campsList, setCampsList] = useState<CampRecord[]>(() => campStore.getCamps());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState<CboDoctorMaster | null>(() => CBO_MASTER_130_DOCTORS[45] || null);
  const [doctorSearchText, setDoctorSearchText] = useState('');
  
  const [campTypeChoice, setCampTypeChoice] = useState<string>('HbA1c & Neuropathy Screening Camp');
  const [isCustomCampType, setIsCustomCampType] = useState(false);
  const [customCampTypeText, setCustomCampTypeText] = useState('');

  const [selectedFocusBrands, setSelectedFocusBrands] = useState<string[]>(['VALROS 10 TAB', 'VINTEL 40 TAB']);
  const [productSearchText, setProductSearchText] = useState('');

  const [campDate, setCampDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/2026`;
  });

  // Time & Touch Clock
  const [campTime, setCampTime] = useState<string>('10:00 AM');
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockMode, setClockMode] = useState<'HOUR' | 'MINUTE'>('HOUR');
  const [clockHour, setClockHour] = useState<number>(10);
  const [clockMinute, setClockMinute] = useState<number>(0);
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('AM');
  const clockDialRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingClock, setIsDraggingClock] = useState(false);

  const [clinicVenue, setClinicVenue] = useState<string>('Sec. 3, Udaipur');

  // Patients Roster
  const [patients, setPatients] = useState<CampPatientEntry[]>([
    { id: 'p1', patientName: 'Ramesh Lal Sharma', mobileNumber: '9829012345', age: 54, gender: 'M', ageGender: '54/M', testType: 'HbA1c', testValue: 8.4, testDiagnosis: '🔴 Poor Control', testResult: 'HbA1c: 8.4% (🔴 Poor Control)', isPrescribed: true, brandPrescribed: 'VALROS 10 TAB', dosageFrequency: 'BD', prescribedDuration: '3 Months', stripsCount: 18 },
    { id: 'p2', patientName: 'Mohan Lal Meena', mobileNumber: '9414056789', age: 48, gender: 'M', ageGender: '48/M', testType: 'VPT', testValue: 26, testDiagnosis: '🔴 High Risk Neuropathy', testResult: 'VPT: 26V (🔴 High Risk Neuropathy)', isPrescribed: false, brandPrescribed: '-', dosageFrequency: 'OD', prescribedDuration: '-', stripsCount: 0 },
    { id: 'p3', patientName: 'Geeta Devi', mobileNumber: '', age: 60, gender: 'F', ageGender: '60/F', testType: 'RBS', testValue: 260, testDiagnosis: '🔴 Diabetic Random', testResult: 'RBS: 260 mg/dL (🔴 Diabetic)', isPrescribed: false, brandPrescribed: '-', dosageFrequency: 'OD', prescribedDuration: '-', stripsCount: 0 },
    { id: 'p4', patientName: 'Kanti Lal Soni', mobileNumber: '7014694989', age: 52, gender: 'M', ageGender: '52/M', testType: 'RBS', testValue: 120, testDiagnosis: '🟢 Normal', testResult: 'RBS: 120 mg/dL (🟢 Normal)', isPrescribed: false, brandPrescribed: '-', dosageFrequency: 'OD', prescribedDuration: '-', stripsCount: 0 }
  ]);

  // 🌟 FAST SCREENING MODAL & EDIT STATE
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<{
    patientName: string;
    mobileNumber: string;
    age: number | string;
    gender: 'M' | 'F' | 'O';
    testType: ClinicalTestType;
    testValue: string;
  }>({
    patientName: '',
    mobileNumber: '',
    age: 50,
    gender: 'M',
    testType: 'RBS',
    testValue: '240'
  });

  // POB State
  const [gotPob, setGotPob] = useState<boolean>(true);
  const [pobItems, setPobItems] = useState<CampPobItem[]>([
    { id: 'pob1', productName: 'VALROS 10 TAB', boxes: 1, strips: 10 }
  ]);
  const [pobChemist, setPobChemist] = useState<string>('Local Chemist');
  const [selectedPobProduct, setSelectedPobProduct] = useState<string>('VALROS 10 TAB');
  const [newPobBoxes, setNewPobBoxes] = useState<number>(1);
  const [newPobStrips, setNewPobStrips] = useState<number>(10);

  const activeCampType = isCustomCampType ? (customCampTypeText || 'Custom Clinical Camp') : campTypeChoice;

  const modalTestEval = useMemo(() => {
    const val = parseFloat(patientForm.testValue) || 0;
    return evaluateTestResult(patientForm.testType, val);
  }, [patientForm.testType, patientForm.testValue]);

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

  // Open Fast Screening Modal (For New Entry)
  const handleOpenFastPatientModal = () => {
    setEditingPatientId(null);
    const defTest = getDefaultTestType(activeCampType);
    let sampleVal = '240';
    if (defTest === 'HbA1c') sampleVal = '8.4';
    if (defTest === 'VPT') sampleVal = '26';
    if (defTest === 'BMD') sampleVal = '-2.8';
    if (defTest === 'FBS') sampleVal = '150';

    setPatientForm({
      patientName: '',
      mobileNumber: '',
      age: 50,
      gender: 'M',
      testType: defTest,
      testValue: sampleVal
    });
    setShowPatientModal(true);
  };

  // 🌟 OPEN MODAL FOR EDITING AN EXISTING PATIENT
  const handleOpenEditPatientModal = (p: CampPatientEntry) => {
    setEditingPatientId(p.id);
    setPatientForm({
      patientName: p.patientName,
      mobileNumber: p.mobileNumber || '',
      age: p.age || 50,
      gender: p.gender || 'M',
      testType: p.testType || 'RBS',
      testValue: String(p.testValue || '240')
    });
    setShowPatientModal(true);
  };

  // 🌟 SAVE / UPDATE PATIENT (Handles both Create and Edit seamlessly!)
  const handleSavePatientFromModal = () => {
    if (!patientForm.patientName.trim()) {
      alert("Kripya Patient ka Naam zaroor likhein!");
      return;
    }

    const valNum = parseFloat(patientForm.testValue) || 0;
    const evalRes = evaluateTestResult(patientForm.testType, valNum);
    const ageNum = patientForm.age || 50;
    const genderVal = patientForm.gender || 'M';
    const ageGenderStr = `${ageNum}/${genderVal}`;

    if (editingPatientId) {
      // Update Existing Patient without resetting Rx duration / prescription
      setPatients(prev => prev.map(item => {
        if (item.id === editingPatientId) {
          return {
            ...item,
            patientName: patientForm.patientName.trim(),
            mobileNumber: patientForm.mobileNumber.trim(),
            age: ageNum,
            gender: genderVal,
            ageGender: ageGenderStr,
            testType: patientForm.testType,
            testValue: patientForm.testValue,
            testDiagnosis: evalRes.label,
            testResult: `${patientForm.testType}: ${patientForm.testValue} (${evalRes.label})`
          };
        }
        return item;
      }));
      setStatusMsg(`🎉 Patient Dr. ${patientForm.patientName} details successfully updated!`);
    } else {
      // Create New Entry
      const defaultBrand = selectedFocusBrands[0] || 'VALROS 10 TAB';
      const isDiabeticOrHighRisk = evalRes.status === 'HIGH' || evalRes.status === 'CRITICAL' || evalRes.status === 'BORDERLINE';
      const autoStrips = isDiabeticOrHighRisk ? calculateStripsFromDurationAndFreq(defaultBrand, '1 Month', 'OD') : 0;

      const newEntry: CampPatientEntry = {
        id: 'p_' + Date.now(),
        patientName: patientForm.patientName.trim(),
        mobileNumber: patientForm.mobileNumber.trim(),
        age: ageNum,
        gender: genderVal,
        ageGender: ageGenderStr,
        testType: patientForm.testType,
        testValue: patientForm.testValue,
        testDiagnosis: evalRes.label,
        testResult: `${patientForm.testType}: ${patientForm.testValue} (${evalRes.label})`,
        isPrescribed: isDiabeticOrHighRisk,
        brandPrescribed: isDiabeticOrHighRisk ? defaultBrand : '-',
        dosageFrequency: 'OD',
        prescribedDuration: isDiabeticOrHighRisk ? '1 Month' : '-',
        stripsCount: autoStrips
      };

      setPatients(prev => [...prev, newEntry]);
      setStatusMsg(`🎉 Patient ${newEntry.patientName} (${newEntry.testDiagnosis}) added to roster!`);
    }

    setShowPatientModal(false);
    setEditingPatientId(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleTogglePrescribed = (id: string, currentlyPrescribed: boolean) => {
    const nextState = !currentlyPrescribed;
    const defaultBrand = selectedFocusBrands[0] || 'VALROS 10 TAB';

    setPatients(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (nextState) {
        const strips = calculateStripsFromDurationAndFreq(defaultBrand, '1 Month', p.dosageFrequency || 'OD');
        return {
          ...p,
          isPrescribed: true,
          brandPrescribed: defaultBrand,
          prescribedDuration: '1 Month',
          stripsCount: strips
        };
      } else {
        return {
          ...p,
          isPrescribed: false,
          brandPrescribed: '-',
          prescribedDuration: '-',
          stripsCount: 0
        };
      }
    }));
  };

  const handleFreqChange = (id: string, newFreq: DosageFrequency, currentBrand: string, currentDuration: string) => {
    const b = currentBrand === '-' ? (selectedFocusBrands[0] || 'VALROS 10 TAB') : currentBrand;
    const dur = currentDuration === '-' ? '1 Month' : currentDuration;
    const newStrips = calculateStripsFromDurationAndFreq(b, dur, newFreq);

    setPatients(prev => prev.map(p => p.id === id ? {
      ...p,
      dosageFrequency: newFreq,
      stripsCount: newStrips
    } : p));
  };

  const handleDurationChange = (id: string, newDur: string, currentBrand: string, currentFreq: DosageFrequency) => {
    const b = currentBrand === '-' ? (selectedFocusBrands[0] || 'VALROS 10 TAB') : currentBrand;
    const newStrips = calculateStripsFromDurationAndFreq(b, newDur, currentFreq);

    setPatients(prev => prev.map(p => p.id === id ? {
      ...p,
      prescribedDuration: newDur,
      stripsCount: newStrips
    } : p));
  };

  const handleCustomStripsChange = (id: string, customStripsStr: string, currentBrand: string, currentFreq: DosageFrequency) => {
    const cleanStr = customStripsStr.replace(/^0+/, '');
    const numStrips = Math.max(0, parseFloat(cleanStr) || 0);
    const b = currentBrand === '-' ? (selectedFocusBrands[0] || 'VALROS 10 TAB') : currentBrand;
    const calculatedDuration = calculateDurationFromStripsAndFreq(b, numStrips, currentFreq);

    setPatients(prev => prev.map(p => p.id === id ? {
      ...p,
      stripsCount: numStrips,
      prescribedDuration: calculatedDuration
    } : p));
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

  // Touch Clock Calculations
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

  // Summary Metrics
  const totalScreened = patients.filter(p => p.patientName.trim().length > 0).length || patients.length;
  const totalStrips = patients.reduce((acc, p) => acc + (p.isPrescribed ? (Number(p.stripsCount) || 0) : 0), 0);
  const totalRx = patients.filter(p => p.isPrescribed && p.brandPrescribed !== '-').length;

  const brandRxSummary = useMemo(() => {
    const map: Record<string, { rx: number; strips: number; durations: Set<string> }> = {};
    patients.forEach(p => {
      if (p.isPrescribed && p.brandPrescribed !== '-') {
        const b = p.brandPrescribed;
        if (!map[b]) map[b] = { rx: 0, strips: 0, durations: new Set() };
        map[b].rx += 1;
        map[b].strips += Number(p.stripsCount) || 0;
        if (p.prescribedDuration && p.prescribedDuration !== '-') map[b].durations.add(p.prescribedDuration);
      }
    });
    return map;
  }, [patients]);

  const startingMessageText = useMemo(() => {
    const docName = selectedDoctor ? `Dr. ${selectedDoctor.doctorName} (${selectedDoctor.speciality})` : 'Doctor';
    const venue = clinicVenue || selectedDoctor?.clinicAddress || selectedDoctor?.station || 'Clinic';
    const brands = selectedFocusBrands.join(', ');

    return `🚩 *CAMP INITIATION UPDATE* 🚩\n\n👨‍⚕️ *Doctor:* ${docName}\n🏥 *Hospital/Clinic:* ${venue}\n🔬 *Camp Type:* ${activeCampType}\n🎯 *Focus Brands:* ${brands}\n📅 *Date & Time:* ${campDate} | ${campTime}`;
  }, [selectedDoctor, clinicVenue, activeCampType, selectedFocusBrands, campDate, campTime]);

  const finalClosureReportText = useMemo(() => {
    const docName = selectedDoctor ? `Dr. ${selectedDoctor.doctorName}` : 'Doctor';
    const docSpec = selectedDoctor?.speciality ? ` (${selectedDoctor.speciality})` : '';
    const venue = clinicVenue || selectedDoctor?.clinicAddress || selectedDoctor?.station || 'Clinic';

    const lines: string[] = [];
    lines.push(`🏆 *CAMP CLOSURE & PRESCRIPTION UPDATE* 🏆\n`);
    lines.push(`I have successfully conducted the *${activeCampType}* at *${docName}*${docSpec}, *${venue}*.\n`);
    lines.push(`📊 *Camp Screening Summary:*`);
    lines.push(`• Total Patients Screened: ${totalScreened} Patients`);
    lines.push(`• Total Prescriptions Generated: ${totalRx} Rx (${totalStrips} Strips)\n`);

    lines.push(`💊 *Prescription & Chemist Feedback:*`);
    lines.push(`As per the clinic & chemist feedback, I got:`);

    const entries = Object.entries(brandRxSummary);
    if (entries.length > 0) {
      entries.forEach(([bName, bData]) => {
        const durList = Array.from(bData.durations).join(', ') || '1 Month';
        lines.push(`• *${bName}:* ${bData.rx} Prescriptions (${durList} | ${bData.strips} Strips)`);
      });
    } else {
      lines.push(`• Screened patients are under evaluation.`);
    }

    if (gotPob && pobItems.length > 0) {
      lines.push(``);
      const pobLines = pobItems.map(it => `${it.productName} (${it.boxes} Box / ${it.strips} Strips)`).join(', ');
      const chemistStr = pobChemist.trim() ? ` from ${pobChemist.trim()}` : '';
      lines.push(`🛒 *POB Generated:* ${pobLines}${chemistStr}`);
    }

    lines.push(``);
    lines.push(`📅 *Date:* ${campDate} | *Time:* ${campTime}`);

    return lines.join('\n');
  }, [selectedDoctor, clinicVenue, activeCampType, campDate, campTime, totalScreened, brandRxSummary, totalRx, totalStrips, gotPob, pobItems, pobChemist]);

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
      pobItems: gotPob ? JSON.parse(JSON.stringify(pobItems)) : [],
      pobChemist: gotPob ? pobChemist.trim() : '',
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
            Patient Edit &bull; Rx YES/NO &bull; OD/BD/TDS Frequency &bull; Bidirectional Strips Math &bull; Got POB Toggle
          </p>
        </div>
      </div>

      <CloudSyncBar
        storageKey="camps/clinical_activities_vault_v5"
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
              
              {/* Doctor Picker */}
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

          {/* STEP 2: PATIENT ROSTER (WITH EDIT ✏️ BUTTON & MODAL SYNC) */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Users size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Step 2: Patient Screening Roster &bull; ({patients.length} Screened)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tap <b className="text-cyan-400">"Edit ✏️"</b> to modify Name, Mobile, Test Reading &bull; Strips auto-syncs duration!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenFastPatientModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95"
              >
                <Plus size={16} /> + Add New Patient
              </button>
            </div>

            <div className="overflow-x-auto max-h-[460px] border border-slate-800 rounded-2xl shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-8">#</th>
                    <th className="p-2.5 min-w-[160px]">Patient Name</th>
                    <th className="p-2.5 w-20 text-center">Age / Sex</th>
                    <th className="p-2.5 min-w-[180px] text-cyan-400">Clinical Test Value &amp; Diagnosis</th>
                    <th className="p-2.5 text-center w-20 text-emerald-400">Rx Given?</th>
                    <th className="p-2.5 min-w-[160px] text-amber-400">Brand Prescribed</th>
                    <th className="p-2.5 text-center w-24 text-purple-300">Dosage</th>
                    <th className="p-2.5 min-w-[140px] text-purple-300">Prescribed For</th>
                    <th className="p-2.5 text-center w-24 text-emerald-400">Strips (Edit)</th>
                    <th className="p-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {patients.map((p, idx) => {
                    const isRx = p.isPrescribed;

                    return (
                      <tr key={p.id} className={`transition ${isRx ? 'bg-slate-900 hover:bg-slate-800/40' : 'bg-slate-950/80 opacity-70'}`}>
                        <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                        
                        {/* Patient Name (Clickable to Edit) */}
                        <td className="p-2.5 font-sans font-bold text-white">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPatientModal(p)}
                            className="text-left font-bold text-white hover:text-cyan-300 transition cursor-pointer flex items-center gap-1.5 group"
                            title="Click to Edit Patient Details"
                          >
                            <span>{p.patientName}</span>
                            <Edit3 size={11} className="text-slate-500 group-hover:text-cyan-400" />
                          </button>
                          {p.mobileNumber && <span className="text-[10px] text-slate-400 font-mono block">📞 {p.mobileNumber}</span>}
                        </td>

                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            (p.gender || 'M') === 'F' ? 'bg-pink-950 text-pink-300 border border-pink-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {p.ageGender || `${p.age}/${p.gender || 'M'}`}
                          </span>
                        </td>

                        <td className="p-2.5">
                          <div className="font-semibold text-cyan-300">{p.testType}: {p.testValue}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{p.testDiagnosis}</div>
                        </td>

                        {/* Rx YES/NO */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePrescribed(p.id, isRx)}
                            className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition cursor-pointer border ${
                              isRx 
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm' 
                                : 'bg-slate-950 text-rose-400 border-rose-900/60 hover:bg-rose-950'
                            }`}
                          >
                            {isRx ? '✅ YES' : '❌ NO'}
                          </button>
                        </td>

                        {/* Brand Prescribed */}
                        <td className="p-2">
                          {isRx ? (
                            <select
                              value={p.brandPrescribed}
                              onChange={e => {
                                const newB = e.target.value;
                                const newStrips = calculateStripsFromDurationAndFreq(newB, p.prescribedDuration || '1 Month', p.dosageFrequency || 'OD');
                                setPatients(prev => prev.map(item => item.id === p.id ? { ...item, brandPrescribed: newB, stripsCount: newStrips } : item));
                              }}
                              className="w-full bg-slate-950 border border-amber-500/50 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                            >
                              <optgroup label="Camp Major Focus Brands">
                                {selectedFocusBrands.map(b => <option key={b} value={b}>{b}</option>)}
                              </optgroup>
                              <optgroup label="All 73 Master Products">
                                {MASTER_PRODUCTS.map(mp => <option key={mp.sn} value={mp.name}>{mp.name}</option>)}
                              </optgroup>
                            </select>
                          ) : (
                            <span className="text-slate-600 font-sans">-</span>
                          )}
                        </td>

                        {/* Dosage Frequency */}
                        <td className="p-2 text-center">
                          {isRx ? (
                            <select
                              value={p.dosageFrequency || 'OD'}
                              onChange={e => handleFreqChange(p.id, e.target.value as DosageFrequency, p.brandPrescribed, p.prescribedDuration)}
                              className="bg-slate-950 border border-purple-500/40 text-purple-300 font-black rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer text-center"
                            >
                              <option value="OD">OD (1/day)</option>
                              <option value="BD">BD (2/day)</option>
                              <option value="TDS">TDS (3/day)</option>
                              <option value="WEEKLY">Weekly</option>
                            </select>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Duration (Months / Days) */}
                        <td className="p-2">
                          {isRx ? (
                            <select
                              value={p.prescribedDuration || '1 Month'}
                              onChange={e => handleDurationChange(p.id, e.target.value, p.brandPrescribed, p.dosageFrequency || 'OD')}
                              className="w-full bg-slate-950 border border-purple-500/40 text-purple-300 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                            >
                              {p.prescribedDuration && !BASE_DURATION_OPTIONS.includes(p.prescribedDuration) && (
                                <option value={p.prescribedDuration}>{p.prescribedDuration}</option>
                              )}
                              {BASE_DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Strips Input */}
                        <td className="p-2 text-center">
                          {isRx ? (
                            <input
                              type="number"
                              value={p.stripsCount}
                              onChange={e => handleCustomStripsChange(p.id, e.target.value, p.brandPrescribed, p.dosageFrequency || 'OD')}
                              className="w-16 py-1 px-1 bg-slate-950 border border-emerald-500/60 text-emerald-400 font-black text-center rounded-lg focus:outline-none mx-auto text-xs"
                              title="Type strips count (e.g. 18) to auto-calculate duration in Prescribed For!"
                            />
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>

                        {/* 🌟 2 ACTIONS: EDIT (✏️) AND DELETE (🗑️) */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPatientModal(p)}
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 rounded-lg transition cursor-pointer"
                              title="Edit Patient Details"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePatient(p.id)}
                              className="p-1.5 bg-slate-950 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-rose-400 rounded-lg transition cursor-pointer"
                              title="Delete Patient"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* STEP 3: OPTIONAL PRODUCT-WISE POB (BOXES & STRIPS) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} className="text-amber-400" />
                  <span className="text-amber-300 font-bold uppercase tracking-wider">
                    POB Booking on Camp Day:
                  </span>
                </div>

                {/* 1-Click Got POB YES / NO */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGotPob(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      gotPob 
                        ? 'bg-emerald-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check size={12} /> Got POB (YES)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGotPob(false);
                      setPobItems([]);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      !gotPob 
                        ? 'bg-rose-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <X size={12} /> No POB (Hide in Report)
                  </button>
                </div>
              </div>

              {gotPob ? (
                <div className="space-y-2 pt-1 border-t border-slate-900">
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
              ) : (
                <div className="text-slate-500 italic py-1">
                  No POB received on camp day &bull; POB section will be completely excluded from final WhatsApp message.
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
                    Step 3: Final Camp Closure &amp; Prescription WhatsApp Report
                  </h2>
                  <p className="text-xs text-slate-400">Natural executive update &bull; Auto-excludes POB if NO &bull; Direct Save to Vault</p>
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

      {/* 🌟 PATIENT MODAL: SUPPORTS BOTH NEW ENTRY AND LIVE EDITING */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Users size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPatientId ? 'Edit Patient Details' : 'Fast Patient Screening Entry'}
                  </h3>
                  <p className="text-xs text-slate-400">Camp: <b className="text-cyan-300">{activeCampType.split(' ')[0]}</b> &bull; Dr. {selectedDoctor?.doctorName || 'Doctor'}</p>
                </div>
              </div>
              <button onClick={() => setShowPatientModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto space-y-3.5 pr-1 text-xs">
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
                    <Phone size={12} className="text-cyan-400" /> Mobile Number:
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

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold">Age &amp; Gender:</label>
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

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, gender: 'M' })}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 border ${
                        patientForm.gender === 'M' ? 'bg-cyan-600 text-white border-cyan-400 shadow-md' : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      👦 Male (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, gender: 'F' })}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 border ${
                        patientForm.gender === 'F' ? 'bg-pink-600 text-white border-pink-400 shadow-md' : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      👧 Female (F)
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-cyan-500/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-bold flex items-center gap-1">
                    <Activity size={14} className="text-cyan-400" /> Clinical Test Type &amp; Reading:
                  </label>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    modalTestEval.status === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    modalTestEval.status === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-500/50' :
                    modalTestEval.status === 'BORDERLINE' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {modalTestEval.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Test Name:</label>
                    <select
                      value={patientForm.testType}
                      onChange={e => {
                        const t = e.target.value as ClinicalTestType;
                        let def = '240';
                        if (t === 'HbA1c') def = '8.4';
                        if (t === 'VPT') def = '26';
                        if (t === 'BMD') def = '-2.8';
                        if (t === 'FBS') def = '150';
                        setPatientForm({ ...patientForm, testType: t, testValue: def });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="RBS">RBS (Random Sugar)</option>
                      <option value="FBS">FBS (Fasting Sugar)</option>
                      <option value="PPBS">PPBS (Post-Prandial)</option>
                      <option value="HbA1c">HbA1c (%)</option>
                      <option value="VPT">VPT (Neuropathy - Volts)</option>
                      <option value="BMD">BMD (T-Score)</option>
                      <option value="BP">BP (Blood Pressure)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Enter Reading / Value:</label>
                    <input
                      type="text"
                      placeholder="e.g. 240 or 8.4"
                      value={patientForm.testValue}
                      onChange={e => setPatientForm({ ...patientForm, testValue: e.target.value })}
                      className="w-full bg-slate-900 border border-cyan-500/60 text-cyan-300 font-mono font-black rounded-xl px-3 py-1.5 text-sm text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono">
                  Range Guide: <span className="text-slate-200">{modalTestEval.rangeGuide}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Prescriptions &amp; Strips managed in table</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowPatientModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSavePatientFromModal} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-2xl shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95">
                  <Check size={16} /> {editingPatientId ? 'Update Patient' : 'Add to Roster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Touch Clock Modal */}
      {showClockModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900 tracking-wide">Set Camp Timing (Touch Clock)</h3>
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
                ⏱️ Minute Hand ({clockMinute}m)
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
