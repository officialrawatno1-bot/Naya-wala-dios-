import { standardTheme, borderThin } from '../styles/standardTheme';

const ACTIVE_2026_MONTHS = [
  { label: 'Jan-26', dIdx: 0, rIdx: 1 },
  { label: 'Feb-26', dIdx: 2, rIdx: 3 },
  { label: 'Mar-26', dIdx: 4, rIdx: 5 },
  { label: 'Apr-26', dIdx: 6, rIdx: 7 },
  { label: 'May-26', dIdx: 8, rIdx: 9 },
  { label: 'Jun-26', dIdx: 10, rIdx: 11 },
  { label: 'Jul-26', dIdx: 12, rIdx: 13 },
  { label: 'Aug-26', dIdx: 14, rIdx: 15 },
  { label: 'Sep-26', dIdx: 16, rIdx: 17 },
  { label: 'Oct-26', dIdx: 18, rIdx: 19 },
  { label: 'Nov-26', dIdx: 20, rIdx: 21 },
  { label: 'Dec-26', dIdx: 22, rIdx: 23 },
  { label: 'Jan-27', dIdx: 24, rIdx: 25 },
  { label: 'Feb-27', dIdx: 26, rIdx: 27 },
  { label: 'Mar-27', dIdx: 28, rIdx: 29 },
];

// Screen 2 की हूबहू ओरिजिनल डेट्स व ROI डेटा
const COMPLETE_ROI_DATA = [
  { sn: 1, name: 'ABHAY JAIN', exec: 'BANWARI LAL MEENA', mob: '7014694989', actType: 'CASH', actAmt: '50000/120000', actDate: "Mar'25,March26", cat: 'OLD',
    m: ["9,17,20,23,27,30", 10000, "17,19,20,27", 10000, "9,25,OUT OF TOWN", 10000, "1,7,10,18,21,24,27,29", 35000, "6,8,11,19,26,27,29", 20000, "1,2,12,16,18,", 10000, "", 10000], total: 180000 },
  { sn: 24, name: 'ABHIJEET BASU', exec: 'BANWARI LAL MEENA', mob: '9352517070', actType: 'GIFT CARDS', actAmt: '20000, 20000', actDate: "May'23,may 26", cat: 'OLD',
    m: ["10,12,19", 0, "2,13,17,20,27", 3000, "2,5,20,24,27,28", 0, "7,9,11,17,24", 5000, "4,6,8,15,18", 3000, "13,19,29", 5000, "", 3000], total: 7900 },
  { sn: 9, name: 'AK VATS', exec: 'BANWARI LAL MEENA', mob: '9829279719', actType: 'GIFT CARDS', actAmt: '30000', actDate: "May'25", cat: 'OLD',
    m: ["8,15,28", 1300, "5,19", 5000, "9,19,25", 6000, "1,15.,23,30", 8000, "6,14,21", 8000, "3,18,24", 5000, "", 5000], total: 86900 },
  { sn: 32, name: 'AMIT MEHTA', exec: 'BANWARI LAL MEENA', mob: '9879188503', actType: 'DINNER', actAmt: '3200', actDate: "May'25", cat: 'NEW',
    m: ["2,10,19,29", "", "20,25", "", "5,18", 3000, "3,13,17,24,27", 4500, "8,15,28,29", 4000, "1,3,16", 3000, "", 1000], total: 6600 },
  { sn: 4, name: 'ANISH JAIN', exec: 'BANWARI LAL MEENA', mob: '9414109022', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Apr'25", cat: 'NEW',
    m: ["NTC", 3000, "", 3000, "NTC", 3000, "", 7000, "", 2000, "11,na", 10000, "", 5000], total: 105900 },
  { sn: 28, name: 'BALDEV MEENA', exec: 'BANWARI LAL MEENA', mob: '9549609251', actType: 'IPHONE', actAmt: '75000', actDate: "Jul'25", cat: 'OLD',
    m: ["6,8,20,28", 17000, "5,13,24,25", 21000, "2,9,17,20,28", 23000, "1,2,9,11,18,27", 22000, "14,27,28", 25000, "12,22,25,29", 30000, "", 22000], total: 251500 },
  { sn: 29, name: 'BHUPESH PARTANI', exec: 'BANWARI LAL MEENA', mob: '9414741190', actType: 'GIFT CARD', actAmt: '10000', actDate: "AUG'24", cat: 'OLD',
    m: ["5,21", 0, "6", 0, "23", 0, "6,22", 0, "7,22", 0, "4,23", 0, "", 0], total: 20600 },
  { sn: 17, name: 'BS BOMB', exec: 'BANWARI LAL MEENA', mob: '9352500310', actType: 'GIFT CARDS', actAmt: '30000', actDate: "May'25", cat: 'OLD',
    m: ["9", 5000, "17,21,25", 6000, "2,19", 5000, "4,11,15", 6000, "8,14,18", 9000, "1,18", 6000, "", 3000], total: 94000 },
  { sn: 6, name: 'CHIRAG RATHORE', exec: 'BANWARI LAL MEENA', mob: '9099075657', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Apr'24", cat: 'OLD',
    m: ["OUT OF TOWN", 2000, "7,14,28", 3000, "7", 2000, "25", 1000, "2,16", 3000, "6,20,27", 2000, "", 3000], total: 36000 },
  { sn: 14, name: 'DC SHARMA', exec: 'BANWARI LAL MEENA', mob: '9414159690', actType: 'conference', actAmt: '89000, 150000', actDate: "Sep'24,Apr26", cat: 'OLD',
    m: ["8", 10000, "NTC DUE TO S", 15000, "NTC", 7000, "3,9,10,NTC", 35000, "7,12,28", 40000, "12,18,ntc", "", "", 28000], total: 291100 },
  { sn: 33, name: 'DENNY', exec: 'BANWARI LAL MEENA', mob: '8890644804', actType: 'DINNER', actAmt: '3200, 50000', actDate: "May'25,march 26", cat: 'NEW',
    m: ["8,19", 5000, "2,13,19,27", "", "5,OUT OF TOWN", "", "9,10,24,30", 2000, "8,19,26,29", 6000, "12,18,25", 0, "", 0], total: 5000 },
  { sn: 21, name: 'DP SINGH', exec: 'BANWARI LAL MEENA', mob: '9829164092', actType: 'GIFT CARDS', actAmt: '30000', actDate: "May'25", cat: 'OLD',
    m: ["19,28", 10000, "23,25", 10000, "20,31", 10000, "7,23,27", 12000, "6,11,21,29,30", 13000, "15,24,29", 5000, "", 5000], total: 126200 },
  { sn: 35, name: 'GK MUKHIYA', exec: 'BANWARI LAL MEENA', mob: '8233639147', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Nov'25", cat: 'NEW',
    m: ["2,9,19,23", 15000, "20,27", 15000, "5,28", 15000, "3,11,OUT OF T", 12000, "8,15,29", 15000, "13,19,na", 15000, "", 10000], total: 72000 },
  { sn: 23, name: 'HEMANT MAHUR', exec: 'BANWARI LAL MEENA', mob: '9829040103', actType: 'GIFT CARDS', actAmt: '20000', actDate: "Jan'26", cat: 'OLD',
    m: ["19", 3000, "25,27", 5000, "25", 6000, "NA", 7500, "na", 5000, "0", 3000, "", 3000], total: 82200 },
  { sn: 27, name: 'HITESH YADAV', exec: 'BANWARI LAL MEENA', mob: '8301865586', actType: 'HOTEL', actAmt: '22000, 6000', actDate: "May'24,feb 26", cat: 'OLD',
    m: ["19", 3000, "5,16,20,27", 3000, "9,19,31", 3000, "1,10,15", 7000, "8,11,28", 5000, "12,22,27", 3000, "", 3000], total: 51700 },
  { sn: 7, name: 'JAYESH GANDHI', exec: 'BANWARI LAL MEENA', mob: '7014111410', actType: 'CASH', actAmt: '100000', actDate: "Dec'23, April'24", cat: 'OLD',
    m: ["24", 30000, "7,14,28", 25000, "7,21", 30000, "25", 30000, "2,9,16", 30000, "6,10,20,27", 30000, "", 30000], total: 592000 },
  { sn: 26, name: 'JC DEVPURA', exec: 'BANWARI LAL MEENA', mob: '9829069669', actType: 'GIFT CARDS', actAmt: '10000', actDate: "Feb'24", cat: 'OLD',
    m: ["28", 1300, "5,19,27", 5000, "5,18,19,25", 6000, "7,13,18", 5000, "12", 3000, "2,13,22,29", 4000, "", 2000], total: 48500 },
  { sn: 3, name: 'JIMESH PANDYA', exec: 'BANWARI LAL MEENA', mob: '9950080606', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Mar'25", cat: 'NEW',
    m: ["7,22", 0, "18,26", 0, "26", 0, "8,16", 3000, "13,25", 2000, "17,26", 2000, "", 1000], total: 36600 },
  { sn: 22, name: 'KAVITA BADJATYA', exec: 'BANWARI LAL MEENA', mob: '9413954873', actType: 'GIFT CARDS', actAmt: '20000', actDate: "Nov'25", cat: 'OLD',
    m: ["8,23", 5000, "2,16", 5000, "2,9,25", 6000, "1,7,13,18,20", 7000, "4,11,21,27", 8000, "9,13,15,22,29", 7000, "", 5000], total: 99700 },
  { sn: 20, name: 'KC JAIN', exec: 'BANWARI LAL MEENA', mob: '9414162424', actType: 'GIFT CARDS', actAmt: '20000', actDate: "Sept'22", cat: 'OLD',
    m: ["9", 5000, "OUT OF TOWN", 7000, "2,20", 8000, "18", 8000, "", 7000, "0", 5000, "", 3000], total: 133000 },
  { sn: 2, name: 'KIRIT GANDHI', exec: 'BANWARI LAL MEENA', mob: '7976280712', actType: 'CASH', actAmt: '50000,/50000', actDate: "Mar'25,jan 26", cat: 'OLD',
    m: ["7,22", 25000, "18,26", 30000, "26", 25000, "8,16", 20000, "na,25", 15000, "17,26", 15000, "", 15000], total: 319000 },
  { sn: 30, name: 'KRIPA SHANKAR', exec: 'BANWARI LAL MEENA', mob: '9610251730', actType: 'GIFT CARDS', actAmt: '20000', actDate: "AUG'24", cat: 'OLD',
    m: ["5,21", 0, "6", 0, "23", 0, "6,22", 0, "7,22", 3000, "4,23", 3000, "", 2000], total: 20300 },
  { sn: 8, name: 'MAHESH DAVE', exec: 'BANWARI LAL MEENA', mob: '9414471050', actType: 'CHEQUE', actAmt: '30000', actDate: "Apr'25", cat: 'OLD',
    m: ["8,28", 8000, "13,25", 9000, "17,20", 8000, "1,10,17", 10000, "15,19,26,30", 10000, "na,13,25,30", 8000, "", 10000], total: 134800 },
  { sn: 36, name: 'NAVGEET MATHUR', exec: 'BANWARI LAL MEENA', mob: '', actType: 'GIFT CARDS', actAmt: '20000', actDate: "Jan'26", cat: 'NEW',
    m: ["2,10,12,19,23", "", "13,20,27", "", "20,28", 3000, "3,11, OUT OF T", 5000, "out of town", 3000, "na,13,19", 4000, "", 2000], total: 9800 },
  { sn: 11, name: 'PARAS JAIN', exec: 'BANWARI LAL MEENA', mob: '9829150159', actType: 'GIFT CARDS', actAmt: '40000', actDate: "Jan'26", cat: 'OLD',
    m: ["2,9,12", 8000, "17,27", 8000, "20,31", 7000, "4,15,24", 10000, "14,26", 10000, "1,24", 12000, "", 10000], total: 81800 },
  { sn: 18, name: 'RAHUL PANCHAL', exec: 'BANWARI LAL MEENA', mob: '8290703766', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Feb,25", cat: 'OLD',
    m: ["24", 10000, "7,14,28", 10000, "7,21", 10000, "25", 5000, "2,9,16,23", 15000, "10,20,27,", 10000, "", 10000], total: 150000 },
  { sn: 31, name: 'RAMESH PATEL', exec: 'BANWARI LAL MEENA', mob: '9530079043', actType: 'GIFT CARDS', actAmt: '50000', actDate: "May'25", cat: 'NEW',
    m: ["8", 20000, "13,19", 20000, "NTC", 10000, "1,17,22", 15000, "8,15,18,19,29", 10000, "12,19,24", 15000, "", 12000], total: 119600 },
  { sn: 15, name: 'RK MALOT', exec: 'BANWARI LAL MEENA', mob: '9414102661', actType: 'GIFT CARDS', actAmt: '40000,', actDate: "Aug'23", cat: 'OLD',
    m: ["OUT OF TOWN", 10000, "18,26", 10000, "26", 10000, "8,16", 10000, "13,25", 10000, "17,26", 5000, "", 4000], total: 129000 },
  { sn: 12, name: 'SANDEEP BHATNAGAR', exec: 'BANWARI LAL MEENA', mob: '9414167693', actType: 'GIFT CARDS', actAmt: '30000', actDate: "Apr'24", cat: 'OLD',
    m: ["23,28", 3000, "13,23", 3000, "NA", 3000, "2,15,27", 5000, "21", 4500, "15", 0, "", 0], total: 42800 },
  { sn: 16, name: 'SANDEEP KANSARA', exec: 'BANWARI LAL MEENA', mob: '9352241126', actType: 'CASH', actAmt: '50000', actDate: "May'25", cat: 'OLD',
    m: ["10", 10000, "25", 12000, "NTC", 9000, "11,23", 10000, "14,21", 12000, "2,9,24", 12000, "", 15000], total: 145000 },
  { sn: 13, name: 'SUMIT SIROYA', exec: 'BANWARI LAL MEENA', mob: '8529490073', actType: 'GIFT CARDS', actAmt: '40000', actDate: "Nov'25", cat: 'OLD',
    m: ["", 20000, "NTC", 20000, "25", 20000, "18", 25000, "", 25000, "12", 30000, "", 30000], total: 355000 },
  { sn: 5, name: 'VIJAY GOYAL', exec: 'BANWARI LAL MEENA', mob: '9414026742', actType: 'GIFT CARDS', actAmt: '10000', actDate: "Apr'25", cat: 'NEW',
    m: ["8,28", 10000, "16,", 15000, "9,27,31", 7000, "4,15", 5000, "14", 5000, "1", 5000, "", 3000], total: 51200 },
  { sn: 28, name: 'VINOD K RAI', exec: 'BANWARI LAL MEENA', mob: '9460401750', actType: 'HARRISON BOOK', actAmt: '11000', actDate: "Apr'24", cat: 'OLD',
    m: ["2,8,15,16,23,29", 30000, "5,13,19", 30000, "5,19,28", 30000, "2,10,17,23,24,30", 30000, "8,15,21,28", 30000, "12,18,25", 40000, "", 40000], total: 331500 },
  { sn: 9, name: 'VINOD MEHTA', exec: 'BANWARI LAL MEENA', mob: '9794321171', actType: 'GIFT CARDS', actAmt: '50000', actDate: "Jul'25", cat: 'OLD',
    m: ["2,9,20,23,28", 10000, "5,13,21,27", 10000, "6,16,17,25", 6000, "2,3,11,17", 10000, "14,15,26,29", 2000, "na,16,18,19,29", 20000, "", 15000], total: 188000 },
];

export function buildSheet13_Roi(data?: any) {
  const wsData: any[][] = [];
  const merges: any[] = [];

  const totalCols = 8 + ACTIVE_2026_MONTHS.length * 2 + 2;

  // ==========================================
  // ROW 1: INVESTMENT AND COVERAGE ANALYSIS . (Yellow Banner Merged A1 to H1)
  // ==========================================
  const r1: any[] = [
    { v: 'INVESTMENT AND COVERAGE ANALYSIS . ', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 1; c < 8; c++) r1.push({ v: '', s: standardTheme.headerYellowLeft });
  for (let c = 8; c < totalCols; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  // ==========================================
  // ROW 2: Main Headers (🌟 ENTIRE ROW 2 IS BRIGHT SOLID YELLOW `#FFFF00`!)
  // ==========================================
  const r2: any[] = [
    { v: 'S.N.', s: standardTheme.headerYellowCol },
    { v: 'DR.NAME', s: standardTheme.headerYellowColLeft },
    { v: 'EXECUTIVE NAME', s: standardTheme.headerYellowColLeft },
    { v: 'MOBILE NO.', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY TYPE', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY AMOUNT', s: standardTheme.headerYellowCol },
    { v: 'DATE OF ACTIVITY', s: standardTheme.headerYellowCol },
    { v: 'OLD/NEW', s: standardTheme.headerYellowCol }
  ];

  // 🌟 MONTH HEADERS ARE ALSO BRIGHT SOLID YELLOW `#FFFF00`!
  ACTIVE_2026_MONTHS.forEach(m => {
    r2.push(
      { v: m.label, s: standardTheme.headerYellowCol },
      { v: '', s: standardTheme.headerYellowCol }
    );
  });
  r2.push({ v: 'OLD/NEW', s: standardTheme.headerYellowCol });
  r2.push({ v: 'TOTAL', s: standardTheme.headerYellowCol });
  wsData.push(r2);

  // 2-Row Vertical Merges for Left Yellow Headers (Rows 2 to 3)
  merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }); // S.N.
  merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }); // DR.NAME
  merges.push({ s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }); // EXECUTIVE NAME
  merges.push({ s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }); // MOBILE NO.
  merges.push({ s: { r: 1, c: 4 }, e: { r: 2, c: 4 } }); // ACTIVITY TYPE
  merges.push({ s: { r: 1, c: 5 }, e: { r: 2, c: 5 } }); // ACTIVITY AMOUNT
  merges.push({ s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }); // DATE OF ACTIVITY
  merges.push({ s: { r: 1, c: 7 }, e: { r: 2, c: 7 } }); // OLD/NEW

  // Month 2-Col Horizontal Merges
  ACTIVE_2026_MONTHS.forEach((_, idx) => {
    const startCol = 8 + idx * 2;
    merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 1 } });
  });

  const lastCol = 8 + ACTIVE_2026_MONTHS.length * 2;
  merges.push({ s: { r: 1, c: lastCol }, e: { r: 2, c: lastCol } });         // End OLD/NEW
  merges.push({ s: { r: 1, c: lastCol + 1 }, e: { r: 2, c: lastCol + 1 } }); // TOTAL

  // ==========================================
  // ROW 3: Sub-Headers (🔴 SOLID RED BACKGROUND `#FF0000`)
  // ==========================================
  const r3: any[] = [
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol }
  ];

  ACTIVE_2026_MONTHS.forEach(() => {
    r3.push(
      { v: 'DATE of visit', s: standardTheme.subHeaderRed }, // 🔴 SOLID RED
      { v: 'ROI', s: standardTheme.subHeaderRed }           // 🔴 SOLID RED
    );
  });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  wsData.push(r3);

  // ==========================================
  // ROWS 4 onwards: Doctors Data Rows with Real Visit Dates & ROI
  // ==========================================
  COMPLETE_ROI_DATA.forEach(d => {
    const mCells: any[] = [];

    ACTIVE_2026_MONTHS.forEach(m => {
      const dVal = d.m[m.dIdx] !== undefined ? d.m[m.dIdx] : '';
      const rVal = d.m[m.rIdx] !== undefined ? d.m[m.rIdx] : '';
      const rNum = typeof rVal === 'number' ? rVal : (parseFloat(String(rVal).replace(/,/g, '')) || '');

      mCells.push(
        { v: dVal, s: standardTheme.cellCenter },
        { v: rNum, s: typeof rNum === 'number' ? standardTheme.cellRight : standardTheme.cellCenter }
      );
    });

    const row = [
      { v: d.sn, s: standardTheme.cellCenter },
      { v: d.name, s: standardTheme.cellLeft },
      { v: d.exec, s: standardTheme.cellLeft },
      { v: d.mob, s: standardTheme.cellCenter },
      { v: d.actType, s: standardTheme.cellCenter },
      { v: d.actAmt, s: standardTheme.cellRight },
      { v: d.actDate, s: standardTheme.cellCenter },
      { v: d.cat, s: standardTheme.cellCenter },
      ...mCells,
      { v: d.cat, s: standardTheme.cellCenter },
      { v: d.total, s: standardTheme.cellRight }
    ];

    wsData.push(row);
  });

  return {
    wsData,
    sheetName: '13_ROI',
    merges,
    cols: [
      { wch: 6 },  // Col A: S.N.
      { wch: 22 }, // Col B: DR.NAME
      { wch: 22 }, // Col C: EXECUTIVE NAME
      { wch: 14 }, // Col D: MOBILE NO.
      { wch: 16 }, // Col E: ACTIVITY TYPE
      { wch: 18 }, // Col F: ACTIVITY AMOUNT
      { wch: 18 }, // Col G: DATE OF ACTIVITY
      { wch: 12 }, // Col H: OLD/NEW
      ...ACTIVE_2026_MONTHS.flatMap(() => [{ wch: 18 }, { wch: 10 }]), // DATE of visit, ROI
      { wch: 10 }, // End OLD/NEW
      { wch: 14 }  // TOTAL
    ],
    rows: [
      { hpt: 22 }, // Row 1: Banner
      { hpt: 26 }, // Row 2: Headers (Yellow)
      { hpt: 26 }  // Row 3: Sub-Headers (Red)
    ]
  };
}
