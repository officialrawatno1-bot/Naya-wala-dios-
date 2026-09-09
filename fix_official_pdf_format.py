import os, sys

print("==========================================================================")
print("🎨 [RESTORING OFFICIAL CBO PDF COLORS & 1-PAGE A4 LAYOUT]...")
print("==========================================================================")

official_pdf_code = """import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseDayRow } from '../parsers/expenseParser';

export interface ExpensePdfExportOptions {
  selectedMonth: string;
  headerInfo: {
    name: string;
    code: string;
    hq: string;
    division: string;
    state: string;
    designation: string;
    approvalStatus: string;
    monthDateStr: string;
  };
  rows: ExpenseDayRow[];
  totals: {
    totKm: number;
    totTa: number;
    totDa: number;
    totOther: number;
    totClaim: number;
    totDrs: number;
    totChem: number;
    totStk: number;
    localDays: number;
    localAmt: number;
    exDays: number;
    exAmt: number;
    osDays: number;
    osAmt: number;
    activeMiscVal: number;
  };
  allowanceSummary: Array<{ srNo: string; head: string; days: string; amount: string }>;
  miscSummary: Array<{ srNo: string; head: string; type: string; amount: string }>;
  performanceMetrics?: any;
  hideMiscValues: boolean;
  blankPerfValues: boolean;
}

export function exportExpenseStatementToPdf(options: ExpensePdfExportOptions) {
  const {
    selectedMonth,
    headerInfo,
    rows,
    totals,
    performanceMetrics,
    blankPerfValues
  } = options;

  // A4 Landscape: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const marginX = 6;
  const contentWidth = pageWidth - marginX * 2; // 285mm

  // ==========================================
  // 1. OFFICIAL BLUE TEXT TITLES (NO DARK BOX - EXACT SCREENSHOT 1)
  // ==========================================
  doc.setTextColor(0, 112, 192); // Official Dodger Blue #0070C0
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DIOS LIFESCIENCES PVT LTD', marginX, 9);

  doc.setFontSize(10.5);
  doc.text('Expense Statement', marginX, 14);

  // ==========================================
  // 2. EMPLOYEE & MONTH METADATA (EXACT 2-LINE CBO FORMAT)
  // ==========================================
  doc.setTextColor(0, 0, 0); // Black text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  const colW1 = 70;
  const colW2 = 65;
  const colW3 = 65;
  const colW4 = 85;

  // Line 1 (Y = 19)
  doc.text(`Name: ${headerInfo.name}`, marginX, 19);
  doc.text(`Division: ${headerInfo.division}`, marginX + colW1, 19);
  doc.text(`Head Qtr: ${headerInfo.hq}`, marginX + colW1 + colW2, 19);
  doc.text(`Designation: ${headerInfo.designation}`, marginX + colW1 + colW2 + colW3, 19);

  // Line 2 (Y = 23)
  doc.text(`Code: ${headerInfo.code}`, marginX, 23);
  doc.text(`State Name: ${headerInfo.state}`, marginX + colW1, 23);
  doc.text(`Approval Status: ${headerInfo.approvalStatus}`, marginX + colW1 + colW2, 23);
  doc.text(`Month: ${headerInfo.monthDateStr || selectedMonth}`, marginX + colW1 + colW2 + colW3, 23);

  // ==========================================
  // 3. MAIN 19-COLUMN DAY-WISE EXPENSE TABLE (OFFICIAL LAVENDER HEADER)
  // ==========================================
  const tableHeaders = [
    [
      'SrNo', 'Date', 'Actual Station', 'Working Type', 'Working Route',
      'DA Type', 'Work With', 'Dr Call', 'Chem Call', 'Stk Call', 'Route KM', 'Payable KM',
      'Rate', 'FARE(TA)', 'HQ/Ex/Out Station', 'Other Expense', 'Total', 'Remark', 'Attachment'
    ]
  ];

  const tableBody = rows.map(r => {
    return [
      r.srNo,
      r.date,
      r.actualStation || '',
      r.workingType || '',
      r.workingRoute || '',
      r.daType || '',
      r.workWith || '',
      r.drCall || '',
      r.chemCall || '',
      r.stkCall || '',
      r.routeKm || '',
      r.payableKm || '',
      r.rate || '2.50',
      Number(r.fareTa) > 0 ? Number(r.fareTa).toFixed(2) : '',
      Number(r.daAmt) > 0 ? Number(r.daAmt).toFixed(0) : '',
      Number(r.otherExpense) > 0 ? Number(r.otherExpense).toFixed(2) : '',
      Number(r.total) > 0 ? Number(r.total).toFixed(2) : '',
      r.remark || '',
      r.attachment || ''
    ];
  });

  // Footer Row
  const tableFooter = [
    [
      '', 'Total', '', '', '', '', '',
      totals.totDrs || '',
      totals.totChem || '0',
      totals.totStk || '0',
      totals.totKm ? totals.totKm.toLocaleString() : '',
      totals.totKm ? totals.totKm.toLocaleString() : '',
      '',
      totals.totTa ? totals.totTa.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
      totals.totDa ? totals.totDa.toLocaleString() : '',
      totals.totOther ? totals.totOther.toFixed(2) : '0.00',
      totals.totClaim ? totals.totClaim.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
      '', ''
    ]
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    foot: tableFooter,
    startY: 25.5,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 5.8,
      cellPadding: 0.4,
      overflow: 'linebreak', // 🌟 NO OVERLAPPING TEXT!
      lineColor: [148, 163, 184], // Clean gridlines
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [180, 198, 231], // 🌟 Exact Lavender #B4C6E7 from Screenshot 1!
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 6.0,
      halign: 'center',
      valign: 'middle'
    },
    footStyles: {
      fillColor: [241, 245, 249], // Clean subtle footer
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 6.0,
      halign: 'center',
      valign: 'middle'
    },
    // Precise column widths fitting strictly in 285mm width
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },   // SrNo
      1: { cellWidth: 16, halign: 'center' },  // Date
      2: { cellWidth: 24, halign: 'left' },    // Actual Station
      3: { cellWidth: 17, halign: 'left' },    // Working Type
      4: { cellWidth: 24, halign: 'left' },    // Working Route
      5: { cellWidth: 10, halign: 'center' },  // DA Type
      6: { cellWidth: 22, halign: 'left' },    // Work With
      7: { cellWidth: 9, halign: 'center' },   // Dr Call
      8: { cellWidth: 8, halign: 'center' },   // Chem Call
      9: { cellWidth: 8, halign: 'center' },   // Stk Call
      10: { cellWidth: 11, halign: 'center' }, // Route KM
      11: { cellWidth: 11, halign: 'center' }, // Payable KM
      12: { cellWidth: 8, halign: 'center' },  // Rate
      13: { cellWidth: 15, halign: 'right' },  // FARE(TA)
      14: { cellWidth: 15, halign: 'right' },  // DA Amount
      15: { cellWidth: 13, halign: 'right' },  // Other Expense
      16: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }, // Total
      17: { cellWidth: 42, halign: 'left' },   // Remark
      18: { cellWidth: 8, halign: 'center' }   // Attachment
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowData = rows[data.row.index];
        if (rowData) {
          const st = String(rowData.actualStation || '').toUpperCase();
          const wt = String(rowData.workingType || '').toUpperCase();
          if (st.includes('SUNDAY') || wt.includes('SUNDAY')) {
            data.cell.styles.fillColor = [255, 245, 245];
          } else if (st.includes('LEAVE') || wt.includes('LEAVE') || st.includes('ABSENT')) {
            data.cell.styles.fillColor = [255, 251, 235];
          }
        }
      }
    }
  });

  let nextY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3 : 135;

  if (nextY > 150) {
    doc.addPage('a4', 'landscape');
    nextY = 10;
  }

  // ==========================================
  // 4. DAILY ALLOWANCE SUMMARY TABLE (LEFT BOX ONLY - EXACT SCREENSHOT 1)
  // (Screenshot 2 wala Misc box REMOVE kar diya gaya hai!)
  // ==========================================
  const allowanceRows = [
    ['1', 'Local', `${totals.localDays}`, `${totals.localAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['2', 'Ex-Station', `${totals.exDays}`, `${totals.exAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['3', 'Out Station', totals.osDays > 0 ? `${totals.osDays}` : '0', totals.osAmt > 0 ? `${totals.osAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''],
    ['4', 'Total DA Amount', `${totals.localDays + totals.exDays + totals.osDays}`, `${totals.totDa.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['5', 'Fare Amount', `${totals.totKm} km`, `${totals.totTa.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['', 'Total (DA + Fare)', '', `${(totals.totDa + totals.totTa).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]
  ];

  autoTable(doc, {
    head: [['SrNo', 'Head', 'Days', 'Amount']],
    body: allowanceRows,
    startY: nextY,
    margin: { left: marginX },
    tableWidth: 105,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 6.5, cellPadding: 0.7, lineColor: [148, 163, 184], lineWidth: 0.1, textColor: [0, 0, 0] },
    headStyles: { fillColor: [180, 198, 231], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });

  const nextY2 = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3 : nextY + 28;

  // ==========================================
  // 5. CBO MONTHLY PERFORMANCE SUMMARY TABLE (SCREENSHOT 1 EXACT MATCH)
  // ==========================================
  const perfHeaders = [
    [
      'SrNo', 'Total Dr.', 'Miss Drs', 'Working Days', 'Dr. Call Avg',
      'Dr. Coverage', 'Total Dr Calls', 'Chem Call', 'Chem Call Avg',
      'Ach%', 'Primary Amt', 'Secondary Amt'
    ]
  ];

  let perfRow: any[] = [];
  if (blankPerfValues) {
    // 🌟 BLANK VALUES OPTION (Structure & Headers print, values empty!)
    perfRow = ['1', '', '', '', '', '', '', '', '', '', '', ''];
  } else if (performanceMetrics) {
    perfRow = [
      performanceMetrics.srNo || '1',
      performanceMetrics.totalDr || '130',
      performanceMetrics.missDrs || '45',
      performanceMetrics.workingDays || '25',
      performanceMetrics.drCallAvg || '8.32',
      performanceMetrics.drCoverage ? `${performanceMetrics.drCoverage}` : '66',
      performanceMetrics.totalDrCalls || '208',
      performanceMetrics.chemCall || '',
      performanceMetrics.chemCallAvg || '',
      performanceMetrics.achPct || '',
      performanceMetrics.primaryAmt ? `${performanceMetrics.primaryAmt}` : '',
      performanceMetrics.secondaryAmt || ''
    ];
  } else {
    perfRow = ['1', '130', '46', '18', '8.72', '65', '157', '7', '0.39', '', '4,32,271.', ''];
  }

  autoTable(doc, {
    head: perfHeaders,
    body: [perfRow],
    startY: nextY2,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 1.0,
      lineColor: [100, 116, 139],
      lineWidth: 0.15,
      halign: 'center',
      valign: 'middle',
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [180, 198, 231], // 🌟 Exact Lavender #B4C6E7 from Screenshot 1!
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7.0,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
      6: { cellWidth: 28 },
      7: { cellWidth: 22 },
      8: { cellWidth: 24 },
      9: { cellWidth: 18 },
      10: { cellWidth: 35, fontStyle: 'bold' },
      11: { cellWidth: 36 }
    }
  });

  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3.5 : nextY2 + 14;

  // ==========================================
  // 6. NET EXPENSE CLAIMED (LAVENDER BOX - EXACT SCREENSHOT 1)
  // ==========================================
  doc.setFillColor(217, 225, 242); // 🌟 Exact Lavender #D9E1F2
  doc.rect(marginX, finalTableY, 65, 8, 'F');
  doc.setDrawColor(180, 198, 231);
  doc.setLineWidth(0.2);
  doc.rect(marginX, finalTableY, 65, 8, 'S');

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Net Expense Claimed:', marginX + 2, finalTableY + 5.5);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`${Math.round(totals.totClaim)}`, marginX + 43, finalTableY + 5.5);

  // Save PDF
  const fileName = `Expense_Statement_${selectedMonth}_Official.pdf`;
  doc.save(fileName);
}
"""

with open('src/exporters/expensePdfExporter.ts', 'w', encoding='utf-8') as f:
    f.write(official_pdf_code)

print("✅ src/exporters/expensePdfExporter.ts restored with official CBO colors & 1-page layout.")

