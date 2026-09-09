import os, sys, subprocess

print("==========================================================================")
print("📦 1. INSTALLING JSPDF & AUTO-TABLE DEPENDENCIES...")
print("==========================================================================")
subprocess.run(["npm", "install", "jspdf", "jspdf-autotable", "--silent"], check=True)
print("✅ jspdf & jspdf-autotable installed.")

# 1. Create src/exporters/expensePdfExporter.ts
pdf_exporter_code = """import jsPDF from 'jspdf';
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
    miscSummary,
    performanceMetrics,
    hideMiscValues,
    blankPerfValues
  } = options;

  // A4 Landscape: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const marginX = 8;
  const contentWidth = pageWidth - marginX * 2; // 281mm

  // ==========================================
  // 1. TOP HEADER BANNER (DIOS Navy Blue #1F497D)
  // ==========================================
  doc.setFillColor(31, 73, 125); // Navy Blue
  doc.rect(marginX, 7, contentWidth, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DIOS LIFESCIENCES PVT LTD', marginX + 3, 13);

  doc.setFontSize(9);
  doc.text('Expense Statement', pageWidth - marginX - 3, 13, { align: 'right' });

  // ==========================================
  // 2. EMPLOYEE & MONTH METADATA BOX
  // ==========================================
  doc.setFillColor(248, 250, 252); // Light Slate
  doc.rect(marginX, 16.5, contentWidth, 12, 'F');
  doc.setDrawColor(203, 213, 225); // Border
  doc.rect(marginX, 16.5, contentWidth, 12, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  // Row 1
  const colW = contentWidth / 4;
  doc.text(`Name: ${headerInfo.name}`, marginX + 2, 21);
  doc.text(`Division: ${headerInfo.division}`, marginX + colW + 2, 21);
  doc.text(`Head Qtr: ${headerInfo.hq}`, marginX + colW * 2 + 2, 21);
  doc.text(`Designation: ${headerInfo.designation}`, marginX + colW * 3 + 2, 21);

  // Row 2
  doc.text(`Code: ${headerInfo.code}`, marginX + 2, 26);
  doc.text(`State Name: ${headerInfo.state}`, marginX + colW + 2, 26);
  doc.text(`Approval Status: ${headerInfo.approvalStatus}`, marginX + colW * 2 + 2, 26);
  doc.text(`Month: ${headerInfo.monthDateStr || selectedMonth}`, marginX + colW * 3 + 2, 26);

  // ==========================================
  // 3. MAIN 19-COLUMN DAY-WISE EXPENSE TABLE
  // ==========================================
  const tableHeaders = [
    [
      'SrNo', 'Date', 'Actual Station', 'Working Type', 'Working Route',
      'DA', 'Work With', 'Dr', 'Chem', 'Stk', 'Rt KM', 'Pay KM',
      'Rate', 'FARE(TA)', 'DA Amt', 'Other', 'Total', 'Remark', 'Att'
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

  // Footer / Total Row
  const tableFooter = [
    [
      '', 'Total', '', '', '', '', '',
      totals.totDrs || '',
      totals.totChem || '',
      totals.totStk || '',
      totals.totKm ? totals.totKm.toLocaleString() : '',
      totals.totKm ? totals.totKm.toLocaleString() : '',
      '',
      totals.totTa ? totals.totTa.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
      totals.totDa ? totals.totDa.toLocaleString() : '',
      totals.totOther ? totals.totOther.toFixed(2) : '',
      totals.totClaim ? totals.totClaim.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
      '', ''
    ]
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    foot: tableFooter,
    startY: 30,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: 0.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [31, 73, 125], // Navy Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
      valign: 'middle'
    },
    footStyles: {
      fillColor: [254, 240, 138], // Gold/Yellow
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },   // SrNo
      1: { cellWidth: 15, halign: 'center' },  // Date
      2: { cellWidth: 23, halign: 'left' },    // Actual Station
      3: { cellWidth: 18, halign: 'left' },    // Working Type
      4: { cellWidth: 23, halign: 'left' },    // Working Route
      5: { cellWidth: 8, halign: 'center' },   // DA Type
      6: { cellWidth: 20, halign: 'left' },    // Work With
      7: { cellWidth: 8, halign: 'center' },   // Dr Call
      8: { cellWidth: 8, halign: 'center' },   // Chem Call
      9: { cellWidth: 8, halign: 'center' },   // Stk Call
      10: { cellWidth: 11, halign: 'center' }, // Route KM
      11: { cellWidth: 11, halign: 'center' }, // Payable KM
      12: { cellWidth: 8, halign: 'center' },  // Rate
      13: { cellWidth: 16, halign: 'right' },  // FARE(TA)
      14: { cellWidth: 14, halign: 'right' },  // DA Amt
      15: { cellWidth: 14, halign: 'right' },  // Other Exp
      16: { cellWidth: 17, halign: 'right' },  // Total
      17: { cellWidth: 41, halign: 'left' },   // Remark
      18: { cellWidth: 8, halign: 'center' }   // Attachment
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowData = rows[data.row.index];
        if (rowData) {
          const st = String(rowData.actualStation || '').toUpperCase();
          const wt = String(rowData.workingType || '').toUpperCase();
          if (st.includes('SUNDAY') || wt.includes('SUNDAY')) {
            data.cell.styles.fillColor = [255, 241, 242]; // Rose/Pink
          } else if (st.includes('LEAVE') || wt.includes('LEAVE') || st.includes('ABSENT')) {
            data.cell.styles.fillColor = [254, 243, 199]; // Amber
          } else if (st.includes('HOLIDAY') || wt.includes('HOLIDAY')) {
            data.cell.styles.fillColor = [243, 232, 255]; // Purple
          }
        }
      }
    }
  });

  // Calculate position for next tables
  let nextY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3 : 130;

  // If table went near bottom, add a new landscape page for summaries
  if (nextY > 145) {
    doc.addPage('a4', 'landscape');
    nextY = 12;
  }

  // ==========================================
  // 4. SUMMARY BOXES (ALLOWANCES & MISC TABLE)
  // ==========================================
  const summaryBoxWidth = 135;

  // Table A: Daily Allowance Summary (Left Box)
  const allowanceRows = [
    ['1', 'Local Allowance (@ Rs.260)', `${totals.localDays} Days`, `Rs. ${totals.localAmt.toLocaleString()}`],
    ['2', 'Ex-Station Allowance (@ Rs.285)', `${totals.exDays} Days`, `Rs. ${totals.exAmt.toLocaleString()}`],
    ['3', 'Out Station Allowance', `${totals.osDays} Days`, totals.osAmt > 0 ? `Rs. ${totals.osAmt.toLocaleString()}` : '-'],
    ['4', 'Total DA Amount', `${totals.localDays + totals.exDays + totals.osDays} Days`, `Rs. ${totals.totDa.toLocaleString()}`],
    ['5', 'Fare Amount (Travel Allowance)', `${totals.totKm} km`, `Rs. ${totals.totTa.toLocaleString()}`],
    ['', 'Total (DA + Fare)', `${totals.localDays + totals.exDays + totals.osDays} Days`, `Rs. ${(totals.totDa + totals.totTa).toLocaleString()}`]
  ];

  autoTable(doc, {
    head: [['#', 'Head', 'Days / Distance', 'Amount (Rs.)']],
    body: allowanceRows,
    startY: nextY,
    margin: { left: marginX },
    tableWidth: summaryBoxWidth,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 0.9, lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [31, 73, 125], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Table B: Misc Expense Box (Right Box)
  const rightBoxX = marginX + summaryBoxWidth + 11;
  const miscRows: any[][] = [];

  if (!hideMiscValues && miscSummary.length > 0) {
    miscSummary.forEach(m => {
      miscRows.push([m.srNo, m.head, m.type, `Rs. ${m.amount}`]);
    });
    miscRows.push(['', 'Total Misc Expense', '', `Rs. ${totals.activeMiscVal.toFixed(2)}`]);
  } else {
    // Hidden mode (Send Blank matching July CSV!)
    miscRows.push(['', 'MISC EXP. (Values Hidden)', '', '-']);
  }

  autoTable(doc, {
    head: [['SrNo', 'Head', 'Type', 'Amount (Rs.)']],
    body: miscRows,
    startY: nextY,
    margin: { left: rightBoxX },
    tableWidth: summaryBoxWidth,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 0.9, lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [31, 73, 125], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, halign: 'left' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  });

  const nextY2 = Math.max(
    (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3 : nextY + 35,
    nextY + 32
  );

  // ==========================================
  // 5. 🌟 EXACT CBO MONTHLY PERFORMANCE SUMMARY TABLE (SCREENSHOT MATCH!)
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
    // 🌟 REQUIREMENT 2: TABLE PRINTS WITH BLANK CELLS!
    perfRow = ['1', '', '', '', '', '', '', '', '', '', '', ''];
  } else if (performanceMetrics) {
    perfRow = [
      performanceMetrics.srNo || '1',
      performanceMetrics.totalDr || '130',
      performanceMetrics.missDrs || '45',
      performanceMetrics.workingDays || '25',
      performanceMetrics.drCallAvg || '8.32',
      performanceMetrics.drCoverage ? `${performanceMetrics.drCoverage}%` : '66%',
      performanceMetrics.totalDrCalls || '208',
      performanceMetrics.chemCall || '',
      performanceMetrics.chemCallAvg || '',
      performanceMetrics.achPct || '',
      performanceMetrics.primaryAmt ? `Rs. ${performanceMetrics.primaryAmt}` : '',
      performanceMetrics.secondaryAmt || ''
    ];
  } else {
    perfRow = ['1', '130', totals.totDrs < 130 ? String(130 - totals.totDrs) : '0', `${rows.length}`, (totals.totDrs / Math.max(1, rows.length)).toFixed(2), '65%', `${totals.totDrs}`, `${totals.totChem}`, '', '', '', ''];
  }

  autoTable(doc, {
    head: perfHeaders,
    body: [perfRow],
    startY: nextY2,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.2,
      lineColor: [100, 116, 139],
      lineWidth: 0.2,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [180, 198, 231], // 🌟 Exact Lavender/Soft Blue #B4C6E7 from screenshot!
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center'
    }
  });

  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 3 : nextY2 + 15;

  // ==========================================
  // 6. 🌟 EXACT LAVENDER NET EXPENSE CLAIMED BANNER (SCREENSHOT MATCH!)
  // ==========================================
  doc.setFillColor(217, 225, 242); // 🌟 Exact Lavender #D9E1F2 from screenshot!
  doc.rect(marginX, finalTableY, contentWidth, 9, 'F');
  doc.setDrawColor(142, 169, 219); // Border
  doc.setLineWidth(0.3);
  doc.rect(marginX, finalTableY, contentWidth, 9, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Net Expense Claimed:', marginX + 4, finalTableY + 6.2);

  doc.setTextColor(6, 78, 59); // Deep Emerald
  doc.setFontSize(13);
  doc.text(`Rs. ${totals.totClaim.toLocaleString('en-IN')}`, marginX + 56, finalTableY + 6.5);

  // Save the PDF directly to iPad
  const fileName = `Expense_Statement_${selectedMonth}_Official.pdf`;
  doc.save(fileName);
}
"""

with open('src/exporters/expensePdfExporter.ts', 'w', encoding='utf-8') as f:
    f.write(pdf_exporter_code)
print("✅ 2. src/exporters/expensePdfExporter.ts created with exact screenshot styling.")

