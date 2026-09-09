import * as XLSX from 'xlsx';

export interface ExpenseDayRow {
  srNo: number | string;
  date: string;
  actualStation: string;
  workingType: string;
  workingRoute: string;
  daType: string;
  workWith: string;
  drCall: number | string;
  chemCall: number | string;
  stkCall: number | string;
  routeKm: number | string;
  payableKm: number | string;
  rate: number | string;
  fareTa: number | string;
  daAmt: number | string;
  otherExpense: number | string;
  total: number | string;
  remark: string;
  attachment: string;
}

export interface CboExpenseParsedData {
  monthCode: string;
  header: {
    name: string;
    division: string;
    hq: string;
    designation: string;
    code: string;
    state: string;
    approvalStatus: string;
    monthDateStr: string;
  };
  rows: ExpenseDayRow[];
  allowanceSummary: Array<{ srNo: string; head: string; days: string; amount: string }>;
  miscSummary: Array<{ srNo: string; head: string; type: string; amount: string }>;
  performanceMetrics?: {
    totalDr: string;
    missDrs: string;
    workingDays: string;
    drCallAvg: string;
    drCoverage: string;
    totalDrCalls: string;
    chemCall: string;
    chemCallAvg: string;
    primaryAmt: string;
  };
  netClaimed: number;
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

export async function parseCboExpenseFile(file: File): Promise<CboExpenseParsedData> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const result: CboExpenseParsedData = {
    monthCode: 'Aug-2026',
    header: {
      name: 'BANWARI LAL MEENA',
      division: 'DIOS GROUP',
      hq: 'UDAIPUR',
      designation: 'BUSINESS EXECUTIVE',
      code: 'RJ/SL/0042',
      state: 'RAJASTHAN',
      approvalStatus: 'Pending',
      monthDateStr: '01/08/2026'
    },
    rows: [],
    allowanceSummary: [],
    miscSummary: [],
    netClaimed: 0
  };

  let section: 'HEADER' | 'DAILY' | 'ALLOWANCE' | 'MISC' | 'PERF' = 'HEADER';

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const lineText = row.map((c: any) => String(c || '').trim()).join(' | ');

    // 1. Header & Month
    if (section === 'HEADER') {
      row.forEach((cell: any) => {
        const str = String(cell || '').trim();
        if (str.startsWith('Name:')) result.header.name = str.replace('Name:', '').trim();
        if (str.startsWith('Division:')) result.header.division = str.replace('Division:', '').trim();
        if (str.startsWith('Head Qtr:')) result.header.hq = str.replace('Head Qtr:', '').trim();
        if (str.startsWith('Designation:')) result.header.designation = str.replace('Designation:', '').trim();
        if (str.startsWith('Code:')) result.header.code = str.replace('Code:', '').trim();
        if (str.startsWith('State Name:')) result.header.state = str.replace('State Name:', '').trim();
        if (str.startsWith('Approval Status:')) result.header.approvalStatus = str.replace('Approval Status:', '').trim();

        if (str.startsWith('Month:')) {
          const mPart = str.replace('Month:', '').trim();
          result.header.monthDateStr = mPart;
          const match = mPart.match(/\d{2}\/(\d{2})\/(\d{4})/);
          if (match) {
            const mNum = match[1];
            const mYear = match[2];
            const mName = MONTH_NUM_MAP[mNum] || 'Aug';
            result.monthCode = `${mName}-${mYear}`;
          }
        }
      });

      if (row[0] === 'SrNo' && row[1] === 'Date' && row[2] === 'Actual Station') {
        section = 'DAILY';
        continue;
      }
    }

    // 2. 19-Column Day-Wise Rows
    if (section === 'DAILY') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col1.toLowerCase() === 'total' || col0.toLowerCase() === 'total' || col1 === 'Head') {
        if (col1 === 'Head') section = 'ALLOWANCE';
        continue;
      }

      if (col0 === 'SrNo' && col1 === 'Head') {
        section = 'ALLOWANCE';
        continue;
      }

      if (/^[0-9]+$/.test(col0) && col1.includes('/')) {
        const parseNum = (v: any) => {
          if (!v) return 0;
          const n = parseFloat(String(v).replace(/,/g, '').trim());
          return isNaN(n) ? 0 : n;
        };

        const station = String(row[2] || '').trim();
        const route = String(row[4] || '').trim();
        const rate = parseNum(row[12]) || 2.50;

        // 🌟 RULE 3: BANSWARA / BANSWADA ALWAYS 372 KM
        let km = parseNum(row[11] || row[10]);
        const isBanswara = station.toUpperCase().includes('BANSWA') || route.toUpperCase().includes('BANSWA');
        if (isBanswara) {
          km = 372;
        }

        let fare = parseNum(row[13]);
        if (isBanswara) {
          fare = Number((372 * rate).toFixed(2));
        } else if (!fare && km > 0) {
          fare = Number((km * rate).toFixed(2));
        }

        const da = parseNum(row[14]);
        const other = parseNum(row[15]);
        const tot = parseNum(row[16]) || (fare + da + other);

        result.rows.push({
          srNo: col0,
          date: col1,
          actualStation: station,
          workingType: String(row[3] || '').trim(),
          workingRoute: route,
          daType: String(row[5] || '').trim(),
          workWith: String(row[6] || '').trim(),
          drCall: parseNum(row[7]),
          chemCall: parseNum(row[8]),
          stkCall: parseNum(row[9]),
          routeKm: isBanswara ? 372 : parseNum(row[10]),
          payableKm: km,
          rate: rate.toFixed(2),
          fareTa: fare,
          daAmt: da,
          otherExpense: other,
          total: tot,
          remark: String(row[17] || '').trim(),
          attachment: String(row[18] || '').trim()
        });
      }
      continue;
    }

    // 3. Allowance Summary Box
    if (section === 'ALLOWANCE') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col1 === 'MISC EXP.' || (row[1] && String(row[1]).includes('MISC'))) {
        section = 'MISC';
      } else if (col1 === 'Total Dr.' || (row[1] && String(row[1]).includes('Total Dr'))) {
        section = 'PERF';
      } else if (col0 && col1 && col0 !== 'SrNo') {
        result.allowanceSummary.push({
          srNo: col0,
          head: col1,
          days: String(row[2] || '').trim(),
          amount: String(row[3] || '').trim()
        });
      }
    }

    // 4. Misc Expense Box
    if (section === 'MISC') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col1 === 'Total Dr.' || (row[1] && String(row[1]).includes('Total Dr'))) {
        section = 'PERF';
      } else if (col0 && col1 && col0 !== 'SrNo') {
        result.miscSummary.push({
          srNo: col0,
          head: col1,
          type: String(row[2] || '').trim(),
          amount: String(row[3] || '').trim()
        });
      }
    }

    // 5. Performance Summary
    if (section === 'PERF') {
      const col0 = String(row[0] || '').trim();
      if (/^[0-9]+$/.test(col0) && row[1]) {
        result.performanceMetrics = {
          totalDr: String(row[1] || '').trim(),
          missDrs: String(row[2] || '').trim(),
          workingDays: String(row[3] || '').trim(),
          drCallAvg: String(row[4] || '').trim(),
          drCoverage: String(row[5] || '').trim(),
          totalDrCalls: String(row[6] || '').trim(),
          chemCall: String(row[7] || '').trim(),
          chemCallAvg: String(row[8] || '').trim(),
          primaryAmt: String(row[10] || '').trim()
        };
      }
    }

    if (lineText.includes('Net Expense Claimed:')) {
      const match = lineText.match(/Net Expense Claimed:\s*([0-9.]+)/i);
      if (match) result.netClaimed = parseFloat(match[1]) || 0;
    }
  }

  if (!result.netClaimed && result.rows.length > 0) {
    const sumRows = result.rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    result.netClaimed = sumRows;
  }

  return result;
}
