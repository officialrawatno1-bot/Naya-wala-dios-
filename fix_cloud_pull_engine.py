import os, sys

print("==========================================================================")
print("🛠️ [FIXING CLOUD PULL STALE CLOSURE BUG & PRE-SEEDING REAL CSV DATA]...")
print("==========================================================================")

# 1. Fix CloudSyncBar.tsx (Remove the dangerous setTimeout(onSaveLocal))
with open('src/components/CloudSyncBar.tsx', 'r', encoding='utf-8') as f:
    csb_code = f.read()

bad_timeout = """      // 2. 🌟 Immediately Overwrite iPad's LocalStorage Draft!
      setTimeout(() => {
        if (onSaveLocal) onSaveLocal();
      }, 50);"""

if bad_timeout in csb_code:
    csb_code = csb_code.replace(bad_timeout, "      // Clean pull without stale closure overwrite")
    with open('src/components/CloudSyncBar.tsx', 'w', encoding='utf-8') as f:
        f.write(csb_code)
    print("✅ 1. CloudSyncBar.tsx stale closure wipeout bug FIXED.")

# 2. Update ExpenseWorkspace.tsx with pre-seeded August & July data and safe onLoadData
with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    ws_code = f.read()

# Pre-seeded August and July real CSV rows
august_seed_rows = """const REAL_AUGUST_ROWS: ExpenseDayRow[] = [
  { srNo: 1, date: '01/08/2026', actualStation: 'DUNGARPUR', workingType: 'Working', workingRoute: 'DUNGARPUR', daType: 'EX', workWith: '', drCall: 7, chemCall: 0, stkCall: 0, routeKm: 212, payableKm: 212, rate: '2.50', fareTa: 530, daAmt: 285, otherExpense: 0, total: 815, remark: 'ok', attachment: '' },
  { srNo: 2, date: '02/08/2026', actualStation: 'Sunday', workingType: '', workingRoute: 'Sunday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: '', attachment: '' },
  { srNo: 3, date: '03/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By ,Fever', attachment: '' },
  { srNo: 4, date: '04/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By ,Fever', attachment: '' },
  { srNo: 5, date: '05/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 3, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'due to fever', attachment: '' },
  { srNo: 6, date: '06/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By ,Fever', attachment: '' },
  { srNo: 7, date: '07/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By ,Fever', attachment: '' },
  { srNo: 8, date: '08/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By', attachment: '' },
  { srNo: 9, date: '09/08/2026', actualStation: 'Sunday', workingType: '', workingRoute: 'Sunday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: '', attachment: '' },
  { srNo: 10, date: '10/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: 'AVINASH SONI.', drCall: 9, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 11, date: '11/08/2026', actualStation: 'RAJASMAND', workingType: 'Working', workingRoute: 'RAJASMAND', daType: 'EX', workWith: '', drCall: 8, chemCall: 0, stkCall: 0, routeKm: 124, payableKm: 124, rate: '2.50', fareTa: 310, daAmt: 285, otherExpense: 0, total: 595, remark: 'ok', attachment: '' },
  { srNo: 12, date: '12/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 3, chemCall: 1, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok not evening calls done due to continuous rain', attachment: '' },
  { srNo: 13, date: '13/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 9, chemCall: 1, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 14, date: '14/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 16, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 15, date: '15/08/2026', actualStation: 'Holiday', workingType: 'Holiday', workingRoute: 'Holiday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'INDEPENDENCE DAY', attachment: '' },
  { srNo: 16, date: '16/08/2026', actualStation: 'Sunday', workingType: '', workingRoute: 'Sunday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: '', attachment: '' },
  { srNo: 17, date: '17/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: 'AVINASH SONI.', drCall: 6, chemCall: 1, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 18, date: '18/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 9, chemCall: 2, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 19, date: '19/08/2026', actualStation: 'BANSWADA', workingType: 'Working', workingRoute: 'BANSWADA', daType: 'EX', workWith: 'AVINASH SONI.', drCall: 8, chemCall: 0, stkCall: 0, routeKm: 372, payableKm: 372, rate: '2.50', fareTa: 930, daAmt: 285, otherExpense: 0, total: 1215, remark: '9k', attachment: '' },
  { srNo: 20, date: '20/08/2026', actualStation: 'CHITOR+UDAIPUR', workingType: 'Working', workingRoute: 'CHITOR', daType: 'EX', workWith: 'AVINASH SONI.', drCall: 9, chemCall: 0, stkCall: 0, routeKm: 238, payableKm: 238, rate: '2.50', fareTa: 595, daAmt: 285, otherExpense: 0, total: 880, remark: 'ok', attachment: '' },
  { srNo: 21, date: '21/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: 'AVINASH SONI.', drCall: 15, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 22, date: '22/08/2026', actualStation: 'DUNGARPUR', workingType: 'Working', workingRoute: 'DUNGARPUR', daType: 'EX', workWith: '', drCall: 7, chemCall: 2, stkCall: 1, routeKm: 212, payableKm: 212, rate: '2.50', fareTa: 530, daAmt: 285, otherExpense: 270, total: 1085, remark: 'ok', attachment: '1' },
  { srNo: 23, date: '23/08/2026', actualStation: 'Sunday', workingType: '', workingRoute: 'Sunday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: '', attachment: '' },
  { srNo: 24, date: '24/08/2026', actualStation: 'Leave By HO', workingType: 'Leave By HO', workingRoute: 'Leave By HO', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'Approved By ,Fever', attachment: '' },
  { srNo: 25, date: '25/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 8, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'evening call not done due to ramesh Patel sir passport', attachment: '' },
  { srNo: 26, date: '26/08/2026', actualStation: 'UDAIPUR+RAJASMAND', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 9, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 27, date: '27/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 12, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 28, date: '28/08/2026', actualStation: 'Holiday', workingType: 'Holiday', workingRoute: 'Holiday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: 'RAKSHABANDHAN', attachment: '' },
  { srNo: 29, date: '29/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 15, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' },
  { srNo: 30, date: '30/08/2026', actualStation: 'Sunday', workingType: '', workingRoute: 'Sunday', daType: '', workWith: '', drCall: 0, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 0, otherExpense: 0, total: 0, remark: '', attachment: '' },
  { srNo: 31, date: '31/08/2026', actualStation: 'UDAIPUR', workingType: 'Working', workingRoute: 'UDAIPUR', daType: 'L', workWith: '', drCall: 4, chemCall: 0, stkCall: 0, routeKm: 0, payableKm: 0, rate: '2.50', fareTa: 0, daAmt: 260, otherExpense: 0, total: 260, remark: 'ok', attachment: '' }
];
"""

# Insert pre-seeded rows before ExpenseWorkspace component
if "const REAL_AUGUST_ROWS:" not in ws_code:
    ws_code = ws_code.replace("export const ExpenseWorkspace: React.FC<Props> = ({ onBack }) => {", august_seed_rows + "\nexport const ExpenseWorkspace: React.FC<Props> = ({ onBack }) => {")

# Update initial rows state to fallback to REAL_AUGUST_ROWS if selectedMonth is Aug-2026
ws_code = ws_code.replace(
    "    return [];\n  });",
    "    if (selectedMonth === 'Aug-2026') return REAL_AUGUST_ROWS;\n    return [];\n  });"
)

# Update handleMonthSelect to load REAL_AUGUST_ROWS if Aug-2026
old_month_select = """    setRows([]);
  };"""

new_month_select = """    if (newMonth === 'Aug-2026') {
      setRows(REAL_AUGUST_ROWS);
      setHeaderInfo(prev => ({ ...prev, monthDateStr: '01/08/2026 12:00:00 AM' }));
    } else {
      setRows([]);
    }
  };"""

if old_month_select in ws_code:
    ws_code = ws_code.replace(old_month_select, new_month_select)

# Update CloudSyncBar onLoadData in ExpenseWorkspace
old_onload = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.header) setHeaderInfo(cloudData.header);
          if (cloudData.rows && Array.isArray(cloudData.rows)) setRows(cloudData.rows);
          if (cloudData.allowanceSummary) setAllowanceSummary(cloudData.allowanceSummary);
          if (cloudData.miscSummary) setMiscSummary(cloudData.miscSummary);
          if (cloudData.performanceMetrics) setPerformanceMetrics(cloudData.performanceMetrics);
          if (cloudData.hideMiscValues !== undefined) setHideMiscValues(cloudData.hideMiscValues);
        }}"""

new_onload = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.header) setHeaderInfo(cloudData.header);
          if (cloudData.rows && Array.isArray(cloudData.rows) && cloudData.rows.length > 0) {
            setRows(cloudData.rows);
          } else if (selectedMonth === 'Aug-2026') {
            setRows(REAL_AUGUST_ROWS);
          }
          if (cloudData.allowanceSummary) setAllowanceSummary(cloudData.allowanceSummary);
          if (cloudData.miscSummary) setMiscSummary(cloudData.miscSummary);
          if (cloudData.performanceMetrics) setPerformanceMetrics(cloudData.performanceMetrics);
          if (cloudData.hideMiscValues !== undefined) setHideMiscValues(cloudData.hideMiscValues);

          try {
            localStorage.setItem(`dios_expense_statement_${selectedMonth}`, JSON.stringify(cloudData));
          } catch (e) {}
        }}"""

if old_onload in ws_code:
    ws_code = ws_code.replace(old_onload, new_onload)

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(ws_code)

print("✅ 2. ExpenseWorkspace.tsx pre-seeded with August data & bulletproof cloud pull.")
