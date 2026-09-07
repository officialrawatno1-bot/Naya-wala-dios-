import os, sys, time, json, calendar, traceback
from datetime import datetime
import openpyxl
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"
STREAM_FILE = "/tmp/terminal_stream.log"

def log_stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(STREAM_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass

def fetch_live_dcr_excel(from_month="Aug-2026"):
    month_map = {
        "APR": (4, 2026, 30), "MAY": (5, 2026, 31), "JUN": (6, 2026, 30),
        "JUL": (7, 2026, 31), "AUG": (8, 2026, 31), "SEP": (9, 2026, 30),
        "OCT": (10, 2026, 31), "NOV": (11, 2026, 30), "DEC": (12, 2026, 31),
        "JAN": (1, 2027, 31), "FEB": (2, 2027, 28), "MAR": (3, 2027, 31)
    }
    parts = from_month.split('-')
    m_code = parts[0].upper()[:3]
    m_num, year, last_day = month_map.get(m_code, (8, 2026, 31))
    
    from_date_str = f"01/{m_num:02d}/{year}"
    to_date_str = f"{last_day:02d}/{m_num:02d}/{year}"
    excel_output = f"/tmp/cbo_dcr_{m_code}_{year}.xlsx"

    log_stream("=" * 65)
    log_stream(f"🚀 [LIVE CBO DCR ENGINE] Fetching Real DCR Data for {from_month}...")
    log_stream("=" * 65)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            page.set_default_timeout(45000)

            # 1. Login
            log_stream(f"1. Authenticating as {CBO_USER}...")
            page.goto(LOGIN_URL, timeout=50000, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
            page.wait_for_selector("#ej2-menu_1", timeout=35000)
            log_stream("   ✅ Login Successful.")

            # 2. Navigate to Date Wise Call Detail
            log_stream("2. Navigating: Reports -> DCR Reports -> Date Wise Call Detail...")
            page.locator("a:has-text('Reports'), span:has-text('Reports')").first.click()
            page.wait_for_timeout(600)
            page.locator("a:has-text('DCR Reports'), span:has-text('DCR Reports')").first.click()
            page.wait_for_timeout(600)
            page.locator("a:has-text('Date Wise Call Detail'), span:has-text('Date Wise Call Detail')").first.click()
            page.wait_for_timeout(3000)

            # 3. Apply Dates & Click GO
            log_stream(f"3. Setting CBO DCR Dates ({from_date_str} to {to_date_str}) & Querying...")
            f_dt = datetime.strptime(from_date_str, "%d/%m/%Y")
            t_dt = datetime.strptime(to_date_str, "%d/%m/%Y")

            page.evaluate('''(dates) => {
                const dFrom = new Date(dates.f_yr, dates.f_mo - 1, dates.f_da);
                const dTo = new Date(dates.t_yr, dates.t_mo - 1, dates.t_da);

                const pickers = [];
                document.querySelectorAll('*').forEach(el => {
                    if (el.ej2_instances && el.ej2_instances.length > 0) {
                        el.ej2_instances.forEach(inst => {
                            if (inst.getModuleName && inst.getModuleName() === 'datepicker') pickers.push(inst);
                        });
                    }
                });

                if (pickers.length >= 2) {
                    pickers[0].value = dFrom;
                    if (pickers[0].dataBind) pickers[0].dataBind();
                    pickers[1].value = dTo;
                    if (pickers[1].dataBind) pickers[1].dataBind();
                } else {
                    const inputs = Array.from(document.querySelectorAll('input')).filter(i => i.type !== 'hidden' && i.offsetWidth > 0);
                    if (inputs.length >= 2) {
                        inputs[0].value = dates.from_str;
                        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                        inputs[1].value = dates.to_str;
                        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
                if (go) go.click();
            }''', {
                'from_str': from_date_str, 'to_str': to_date_str,
                'f_yr': f_dt.year, 'f_mo': f_dt.month, 'f_da': f_dt.day,
                't_yr': t_dt.year, 't_mo': t_dt.month, 't_da': t_dt.day
            })

            log_stream("   ⏳ Waiting for DCR report grid to load...")
            page.wait_for_timeout(6000)

            # 4. 🌟 FIXED JAVASCRIPT: Extract Real 31 Daily Rows from CBO Grid
            log_stream("4. Extracting Daily Field Work Rows directly from CBO Grid...")
            daily_rows = page.evaluate('''(dates) => {
                const t5 = document.querySelector('.e-frozencontent table') || document.querySelectorAll('table')[4];
                const t6 = document.querySelector('.e-movablecontent table') || document.querySelectorAll('table')[5];
                const rowsData = [];
                if (t5 && t6) {
                    const rowCount = Math.min(t5.rows.length, t6.rows.length);
                    for (let i = 0; i < rowCount; i++) {
                        const r5 = t5.rows[i];
                        const r6 = t6.rows[i];
                        const date = r5.cells[4] ? r5.cells[4].innerText.trim() : '';
                        const day = r5.cells[5] ? r5.cells[5].innerText.trim() : '';
                        const workType = r5.cells[6] ? r5.cells[6].innerText.trim() : '';
                        const tpRoute = (r6.cells[5] && r6.cells[5].innerText.trim()) || 'UDAIPUR';
                        const workedRoute = r6.cells[6] ? r6.cells[6].innerText.trim() : '';
                        const actualStation = r6.cells[9] ? r6.cells[9].innerText.trim() : '';
                        const drCalls = r6.cells[17] ? r6.cells[17].innerText.trim() : '0';
                        const remark = r6.cells[30] ? r6.cells[30].innerText.trim() : '';
                        const employee = r6.cells[31] ? r6.cells[31].innerText.trim() : '';

                        if (date && date.includes('/')) {
                            rowsData.push({
                                date: date,
                                day: day,
                                workType: workType,
                                tpRoute: tpRoute,
                                workedRoute: workedRoute || actualStation || "UDAIPUR",
                                drCalls: parseInt(drCalls) || 0,
                                remark: remark,
                                employee: employee
                            });
                        }
                    }
                }
                return rowsData;
            }''')

            browser.close()

            log_stream(f"   ✅ Live Extracted {len(daily_rows)} Days from CBO DCR!")

            # 5. Build DCR Excel file with exact columns expected by MonthFwProgressSheet.tsx
            log_stream("5. Generating Formatted DCR Excel for Sheet 2 Auto-Fill...")
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "DCR Summary"

            headers = [
                "SRNO", "COMPANY", "DIVISION", "HQ", "DATE", "DAY", "WORKING TYPE", 
                "TP ROUTE", "WORKED ROUTE", "STATION", "TOTAL DR. CALLS", "TOTAL CHEMIST", 
                "POB", "REMARK", "EMPLOYEE"
            ]
            ws.append(headers)

            total_drs = 0
            for idx, r in enumerate(daily_rows, start=1):
                d_calls = r.get("drCalls", 0)
                total_drs += d_calls
                ws.append([
                    idx, "DIOS", "DIOS GROUP", "UDAIPUR",
                    r.get("date"), r.get("day"), r.get("workType"),
                    r.get("tpRoute", "UDAIPUR"), r.get("workedRoute", "UDAIPUR"),
                    "UDAIPUR", d_calls, 10 if r.get("workType") == "Working" else 0,
                    0, r.get("remark", ""), r.get("employee", "BANWARI LAL MEENA")
                ])

            wb.save(excel_output)
            log_stream(f"🎉 [SUCCESS] Live DCR Excel Saved ({os.path.getsize(excel_output)} bytes)! Total Dr Calls: {total_drs}")
            
            with open(excel_output, "rb") as f:
                return f.read()

    except Exception as e:
        err_tb = traceback.format_exc()
        log_stream(f"❌ DCR Live Engine Error: {str(e)}\n{err_tb}")
        return None

if __name__ == "__main__":
    fetch_live_dcr_excel("Aug-2026")
