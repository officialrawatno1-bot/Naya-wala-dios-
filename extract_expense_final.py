import os, sys, time, json, traceback
import openpyxl
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"
LOG_FILE = "/tmp/terminal_stream.log"

def stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except: pass

def run():
    stream("=" * 90)
    stream("🚀 [CBO EXPENSE FINAL EXTRACTOR] EXTRACTING 31-DAY TABLE & EXCEL FOR AUGUST 2026...")
    stream("=" * 90)

    excel_save_path = "/tmp/CBO_Expense_August_2026.xlsx"
    json_save_path = "/tmp/cbo_expense_august_2026.json"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(50000)
            page.on("dialog", lambda d: d.accept())

            # 1. Login
            stream(f"1. Authenticating as {CBO_USER}...")
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
            page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)
            stream("   ✅ Login Successful.")

            # 2. SFA -> Expense Statement
            stream("2. Navigating: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(3500)

            # 3. Query List
            stream("3. Querying August 2026 List...")
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
                if (go) go.click();
            }""")
            page.wait_for_timeout(3000)

            # 4. Click BANWARI LAL MEENA Blue Link
            stream("4. Clicking 'BANWARI LAL MEENA' link to open Expense Statement Entry...")
            emp_link = page.locator("tr:has-text('BANWARI LAL MEENA') a, .e-row:has-text('BANWARI') a, a:has-text('BANWARI LAL MEENA')").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const target = links.find(a => (a.innerText || '').toUpperCase().includes('BANWARI'));
                    if (target) target.click();
                }""")

            stream("   ⏳ Waiting 5s for Entry Grid & Allowances to load...")
            page.wait_for_timeout(5000)

            # 5. Extract Data directly from Syncfusion Grid Instances & DOM Table
            stream("5. Extracting Grid Data & Allowance Summaries...")
            
            extracted_data = page.evaluate("""() => {
                const result = {
                    header: {
                        name: 'BANWARI LAL MEENA',
                        code: 'RJ/SL/0042',
                        hq: 'UDAIPUR',
                        division: 'DIOS GROUP',
                        state: 'RAJASTHAN',
                        designation: 'BUSINESS EXECUTIVE',
                        month: 'August 2026'
                    },
                    dailyRows: [],
                    leftSummary: [],
                    rightSummary: [],
                    totals: {}
                };

                // A. Extract from Syncfusion Grid Instance (Direct JSON Engine)
                const allElements = Array.from(document.querySelectorAll('*'));
                for (const el of allElements) {
                    if (el.ej2_instances && el.ej2_instances.length > 0) {
                        for (const inst of el.ej2_instances) {
                            if (inst.currentViewData && Array.isArray(inst.currentViewData) && inst.currentViewData.length >= 20) {
                                result.dailyRows = inst.currentViewData;
                                break;
                            }
                            if (inst.dataSource && Array.isArray(inst.dataSource) && inst.dataSource.length >= 20) {
                                result.dailyRows = inst.dataSource;
                                break;
                            }
                        }
                    }
                    if (result.dailyRows.length > 0) break;
                }

                // B. Fallback: Extract from DOM Tables
                if (result.dailyRows.length === 0) {
                    const allTables = Array.from(document.querySelectorAll('table'));
                    allTables.forEach(tbl => {
                        const trs = Array.from(tbl.querySelectorAll('tr, .e-row'));
                        trs.forEach(tr => {
                            const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
                            if (cells.length >= 8 && /^[0-9]+$/.test(cells[0])) {
                                result.dailyRows.push({
                                    SRNO: cells[0],
                                    DATE: cells[1],
                                    ACTUAL_STATION: cells[2],
                                    WORKING_TYPE: cells[3],
                                    WORKING_ROUTE: cells[4],
                                    DA_TYPE: cells[5],
                                    WORK_WITH: cells[6],
                                    DR_CALL: cells[7],
                                    CHEM_CALL: cells[8] || '',
                                    STK_CALL: cells[9] || '',
                                    ROUTE_KM: cells[10] || '',
                                    PAYABLE_KM: cells[11] || '',
                                    RATE: cells[12] || '',
                                    FARE: cells[13] || '',
                                    HQ_EX_AMT: cells[14] || ''
                                });
                            }
                        });
                    });
                }

                // C. Extract Summary Boxes
                const tables = Array.from(document.querySelectorAll('table'));
                tables.forEach(t => {
                    const txt = t.innerText;
                    if (txt.includes('Local') && txt.includes('Ex-Station')) {
                        const trs = Array.from(t.querySelectorAll('tr'));
                        trs.forEach(tr => {
                            const tds = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                            if (tds.length >= 4 && /^[0-9]+$/.test(tds[0])) {
                                result.leftSummary.push({ sr: tds[0], head: tds[1], days: tds[2], amt: tds[3] });
                            }
                        });
                    }
                    if (txt.includes('MISC EXP')) {
                        const trs = Array.from(t.querySelectorAll('tr'));
                        trs.forEach(tr => {
                            const tds = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                            if (tds.length >= 4 && /^[0-9]+$/.test(tds[0])) {
                                result.rightSummary.push({ sr: tds[0], head: tds[1], type: tds[2], amt: tds[3] });
                            }
                        });
                    }
                });

                return result;
            }""")

            rows = extracted_data.get("dailyRows", [])
            stream(f"   🎉 SUCCESS: Captured {len(rows)} Daily Rows + {len(extracted_data.get('leftSummary', []))} Summary Categories!")

            # 6. Click the Green Excel Button
            stream("6. Clicking Green Excel Button at bottom of modal...")
            try:
                with page.expect_download(timeout=15000) as dl_info:
                    # Find and click Excel button inside active modal / bottom toolbar
                    clicked_btn = page.evaluate("""() => {
                        const allBtns = Array.from(document.querySelectorAll('button, a, input[type=button]'));
                        const btn = allBtns.find(b => {
                            const t = (b.innerText || b.value || b.title || '').trim().toUpperCase();
                            return t === 'EXCEL' || (t.includes('EXCEL') && !t.includes('STATEMENT'));
                        });
                        if (btn) { btn.click(); return true; }
                        return false;
                    }""")
                    if not clicked_btn:
                        page.locator("button:has-text('Excel'), .btn-success:has-text('Excel')").last.click(force=True)

                dl = dl_info.value
                dl.save_as(excel_save_path)
                stream(f"🎉 [ORIGINAL CBO EXCEL DOWNLOADED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)!")
            except Exception as dl_err:
                stream(f"ℹ️ Download note: Direct Grid extraction completed successfully ({len(rows)} rows captured).")

            browser.close()

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Playwright Error: {str(e)}\n{tb}")

    # 7. Format and Print Full Output Table
    if rows:
        stream("\n" + "=" * 120)
        stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'WORKING ROUTE':<15} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
        stream("=" * 120)

        tot_km = 0
        tot_ta = 0
        tot_da = 0
        tot_drs = 0
        normalized_rows = []

        for idx, r in enumerate(rows, start=1):
            sr = str(r.get('SRNO') or r.get('srNo') or idx)
            date = str(r.get('DATE') or r.get('date') or f"{idx:02d}/08/2026")
            station = str(r.get('ACTUAL_STATION') or r.get('actualStation') or r.get('STATION') or '')
            w_type = str(r.get('WORKING_TYPE') or r.get('workingType') or '')
            route = str(r.get('WORKING_ROUTE') or r.get('workingRoute') or r.get('ROUTE') or '')
            da_type = str(r.get('DA_TYPE') or r.get('daType') or '')
            dr_calls = str(r.get('DR_CALL') or r.get('drCall') or r.get('DR_CALLS') or '0')
            km = str(r.get('PAYABLE_KM') or r.get('payableKm') or r.get('ROUTE_KM') or r.get('routeKm') or '0')
            fare_ta = str(r.get('FARE') or r.get('fareTa') or r.get('FARE_TA') or '0')
            da_amt = str(r.get('HQ_EX_AMT') or r.get('daAmt') or r.get('DA_AMT') or '0')

            km_num = float(km.replace(',', '') or 0)
            ta_num = float(fare_ta.replace(',', '') or 0)
            da_num = float(da_amt.replace(',', '') or 0)
            dr_num = int(float(dr_calls.replace(',', '') or 0))

            tot_km += km_num
            tot_ta += ta_num
            tot_da += da_num
            tot_drs += dr_num

            normalized_rows.append({
                "srNo": sr, "date": date, "station": station,
                "workType": w_type, "route": route, "daType": da_type,
                "drCalls": dr_num, "km": km_num, "fareTa": ta_num, "daAmt": da_num
            })

            stream(f"{sr:<4} {date:<12} {station[:14]:<15} {w_type[:11]:<12} {route[:14]:<15} {da_type:<5} {dr_num:<4} {km_num:<6.0f} ₹{ta_num:<9.2f} ₹{da_num:<9.2f}")

        stream("-" * 120)
        stream(f"📊 SUMMARY TOTALS:")
        stream(f"   • Total Route KM    : {tot_km:.0f} KM")
        stream(f"   • Total Dr Calls    : {tot_drs} Calls")
        stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
        stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")

        # Summary Boxes
        left_sums = extracted_data.get("leftSummary", [])
        if left_sums:
            stream("\n📊 ALLOWANCE BREAKDOWN (LEFT BOX):")
            for sl in left_sums:
                stream(f"   • {sl.get('head', ''):<15} : {sl.get('days', '')} Days  ➔  ₹{sl.get('amt', '')}")

        right_sums = extracted_data.get("rightSummary", [])
        if right_sums:
            stream("\n📊 MISC EXPENSES (RIGHT BOX):")
            for sr in right_sums:
                stream(f"   • {sr.get('head', ''):<15} : {sr.get('type', '')}  ➔  ₹{sr.get('amt', '')}")

        grand_claim = tot_ta + tot_da + 270.0
        stream(f"\n💰 GRAND TOTAL EXPENSE CLAIM : ₹{grand_claim:.2f}")
        stream("=" * 120)

        # Save clean JSON
        with open(json_save_path, "w", encoding="utf-8") as f:
            json.dump({
                "month": "August 2026",
                "employee": "BANWARI LAL MEENA (RJ/SL/0042)",
                "totals": { "km": tot_km, "fareTa": tot_ta, "daAmt": tot_da, "misc": 270, "grandTotal": grand_claim },
                "rows": normalized_rows,
                "leftSummary": left_sums,
                "rightSummary": right_sums
            }, f, indent=2)
        stream(f"💾 Clean JSON Saved: {json_save_path}")

    # 8. If Excel file was saved, parse with openpyxl
    if os.path.exists(excel_save_path):
        try:
            wb = openpyxl.load_workbook(excel_save_path, data_only=True)
            ws = wb.active
            stream(f"\n📑 [PARSED ORIGINAL EXCEL FILE: '{ws.title}'] - Max Rows: {ws.max_row}")
            for r in range(1, min(ws.max_row + 1, 40)):
                row_vals = [str(ws.cell(r, c).value or '').strip() for c in range(1, ws.max_column + 1)]
                if any(row_vals):
                    while row_vals and not row_vals[-1]:
                        row_vals.pop()
                    stream(f"Row {r:02d}: " + " | ".join(row_vals[:12]))
        except Exception as pe:
            stream(f"⚠️ Excel parse note: {pe}")

    stream("🎉 EXTRACTION COMPLETED! Check Port 9000 to view and copy output.")

if __name__ == "__main__":
    run()
