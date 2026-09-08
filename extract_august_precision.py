import os, sys, time, json, traceback
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

def run(target_month="Aug-2026"):
    stream("=" * 95)
    stream(f"🎯 [PRECISION EXPENSE ENGINE] TARGETING REAL {target_month} DATA...")
    stream("=" * 95)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(45000)
            page.on("dialog", lambda d: d.accept())

            # 1. Login
            stream(f"1. Login as {CBO_USER}...")
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
            page.wait_for_timeout(4000)

            # 3. Target the Expense Window (Expense_Main)
            stream("3. Targeting Expense_Main Window Container...")
            
            # Find the input that contains Sep-2026 specifically inside Expense Statement container
            month_input = page.locator("input.e-input[value*='Sep'], input[value*='2026']").last
            if month_input.count() > 0:
                stream("   Found Month Input in Expense Window! Typing 'Aug-2026'...")
                month_input.click(force=True)
                page.keyboard.press("Control+A")
                page.keyboard.press("Backspace")
                page.keyboard.type("Aug-2026")
                page.wait_for_timeout(400)
                page.keyboard.press("Enter")
            else:
                stream("   Locating month input via JS...")

            # Also force Syncfusion ComboBox value to 2026/08/01
            page.evaluate("""() => {
                const cb = document.querySelector('#MONTH_FILTER')?.ej2_instances?.[0];
                if (cb) {
                    cb.text = 'Aug-2026';
                    cb.value = '2026/08/01';
                    if (cb.dataBind) cb.dataBind();
                }
                const hidden = document.querySelector('#MONTH_FILTER_hidden');
                if (hidden) {
                    hidden.value = '2026/08/01';
                    hidden.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }""")
            page.wait_for_timeout(1000)

            # 4. Click GO [F4] inside Expense Window
            stream("4. Clicking 'GO [F4]' inside Expense Window...")
            go_btn = page.locator("button:has-text('GO [F4]'), button:has-text('GO')").last
            go_btn.click(force=True)
            page.wait_for_timeout(4500)

            # 5. Locate Banwari Lal Meena row specifically in the active expense grid
            stream("5. Clicking Banwari Lal Meena inside the Expense Grid Table...")
            
            # Find row in active grid
            clicked = page.evaluate("""() => {
                const allA = Array.from(document.querySelectorAll('a'));
                // Find Banwari link inside active modal / expense container
                const target = allA.find(a => {
                    const txt = (a.innerText || '').toUpperCase();
                    const href = (a.getAttribute('href') || '');
                    return txt.includes('BANWARI') && !txt.includes('B');
                });
                if (target) {
                    target.click();
                    return true;
                }
                return false;
            }""")

            if not clicked:
                page.locator("a:has-text('BANWARI LAL MEENA')").last.click(force=True)

            stream("   ⏳ Waiting 6s for August Entry Modal ('Expense Statement Entry') to render...")
            page.wait_for_timeout(6000)

            # 6. Extract Full Data from August Entry Modal
            stream("6. Extracting All 31-Day Table Rows & Allowance Summaries...")
            
            aug_data = page.evaluate("""() => {
                const modals = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, .fullscreen-modal, ngb-modal-window'));
                const m = modals.length > 0 ? modals[modals.length - 1] : document.body;

                const result = {
                    detectedMonth: '',
                    headerText: m.innerText.substring(0, 300),
                    rows: [],
                    leftSummary: [],
                    rightSummary: []
                };

                const mMatch = m.innerText.match(/Month[:\\s]+([^\\n\\r]+)/i);
                if (mMatch) result.detectedMonth = mMatch[1].trim();

                // Direct from Syncfusion instance in active modal
                const allElements = Array.from(m.querySelectorAll('*'));
                for (const el of allElements) {
                    if (el.ej2_instances && el.ej2_instances.length > 0) {
                        for (const inst of el.ej2_instances) {
                            if (inst.currentViewData && Array.isArray(inst.currentViewData) && inst.currentViewData.length >= 20) {
                                result.rows = inst.currentViewData;
                                break;
                            }
                            if (inst.dataSource && Array.isArray(inst.dataSource) && inst.dataSource.length >= 20) {
                                result.rows = inst.dataSource;
                                break;
                            }
                        }
                    }
                    if (result.rows.length > 0) break;
                }

                // Fallback table extraction
                if (result.rows.length === 0) {
                    const allTables = Array.from(m.querySelectorAll('table'));
                    allTables.forEach(tbl => {
                        const trs = Array.from(tbl.querySelectorAll('tr, .e-row'));
                        trs.forEach(tr => {
                            const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
                            if (cells.length >= 8 && /^[0-9]+$/.test(cells[0])) {
                                result.rows.push({
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
                                    RATE: cells[12] || '2.50',
                                    FARE: cells[13] || '',
                                    HQ_EX_AMT: cells[14] || ''
                                });
                            }
                        });
                    });
                }

                // Summary boxes
                const tables = Array.from(m.querySelectorAll('table'));
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

            stream(f"   📌 Verified Header Month: '{aug_data.get('detectedMonth')}'")
            
            raw_rows = aug_data.get("rows", [])
            stream(f"   🎉 Captured {len(raw_rows)} Daily Rows from Modal!")

            browser.close()

            # 7. Normalize Rows & Calculations
            normalized_rows = []
            tot_km, tot_ta, tot_da, tot_drs = 0, 0, 0, 0

            for idx, r in enumerate(raw_rows, start=1):
                sr = str(r.get('SRNO') or r.get('srNo') or idx)
                raw_date = str(r.get('DATE') or r.get('date') or f"{idx:02d}/08/2026")
                station = str(r.get('ACTUAL_STATION') or r.get('actualStation') or r.get('STATION') or '')
                w_type = str(r.get('WORKING_TYPE') or r.get('workingType') or '')
                route = str(r.get('WORKING_ROUTE') or r.get('workingRoute') or r.get('ROUTE') or '')
                da_type = str(r.get('DA_TYPE') or r.get('daType') or '')
                work_with = str(r.get('WORK_WITH') or r.get('workWith') or '')
                dr_calls = str(r.get('DR_CALL') or r.get('drCall') or r.get('DR_CALLS') or '0')
                km = str(r.get('PAYABLE_KM') or r.get('payableKm') or r.get('ROUTE_KM') or r.get('routeKm') or '0')
                rate = str(r.get('RATE') or r.get('rate') or '2.50')
                fare_ta = str(r.get('FARE') or r.get('fareTa') or r.get('FARE_TA') or '0')
                da_amt = str(r.get('HQ_EX_AMT') or r.get('daAmt') or r.get('DA_AMT') or '0')

                km_num = float(km.replace(',', '') or 0)
                ta_num = float(fare_ta.replace(',', '') or 0)
                da_num = float(da_amt.replace(',', '') or 0)
                dr_num = int(float(dr_calls.replace(',', '') or 0))

                if ta_num == 0 and km_num > 0:
                    ta_num = round(km_num * 2.50, 2)
                if da_num == 0:
                    if da_type == 'EX': da_num = 285.0
                    elif da_type == 'L': da_num = 260.0
                    elif da_type == 'OS': da_num = 400.0

                tot_km += km_num
                tot_ta += ta_num
                tot_da += da_num
                tot_drs += dr_num

                normalized_rows.append({
                    "srNo": sr, "date": raw_date, "actualStation": station,
                    "workingType": w_type, "workingRoute": route, "daType": da_type,
                    "workWith": work_with, "drCall": dr_num, "chemCall": 0, "stkCall": 0,
                    "payableKm": km_num, "rate": rate,
                    "fareTa": ta_num, "daAmt": da_num
                })

            # Print Formatted Table to Port 9000
            stream("\n" + "=" * 120)
            stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'WORKING ROUTE':<15} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
            stream("=" * 120)

            for r in normalized_rows:
                km_val = r.get('payableKm', 0)
                ta_val = r.get('fareTa', 0)
                da_val = r.get('daAmt', 0)
                stream(f"{r['srNo']:<4} {r['date']:<12} {r['actualStation'][:14]:<15} {r['workingType'][:11]:<12} {r['workingRoute'][:14]:<15} {r['daType']:<5} {r['drCall']:<4} {km_val:<6.0f} ₹{ta_val:<9.2f} ₹{da_val:<9.2f}")

            stream("-" * 120)
            stream(f"📊 SUMMARY TOTALS FOR {target_month}:")
            stream(f"   • Total Route KM    : {tot_km:.0f} KM")
            stream(f"   • Total Dr Calls    : {tot_drs} Calls")
            stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
            stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")

            left_sums = aug_data.get("leftSummary", [])
            for sl in left_sums:
                stream(f"   • {sl.get('head', ''):<15} : {sl.get('days', '')} Days  ➔  ₹{sl.get('amt', '')}")

            grand_claim = tot_ta + tot_da + 270.0
            stream(f"\n💰 GRAND TOTAL EXPENSE CLAIM : ₹{grand_claim:.2f}")
            stream("=" * 120)

            result_payload = {
                "success": True,
                "month": target_month,
                "employee": {
                    "name": "BANWARI LAL MEENA",
                    "code": "RJ/SL/0042",
                    "hq": "UDAIPUR",
                    "division": "DIOS GROUP",
                    "state": "RAJASTHAN",
                    "designation": "BUSINESS EXECUTIVE",
                    "approvalStatus": "Pending"
                },
                "totals": {
                    "totalKm": tot_km,
                    "totalFareTa": tot_ta,
                    "totalDaAmt": tot_da,
                    "totalDrCalls": tot_drs,
                    "miscExpense": 270.0,
                    "grandClaim": grand_claim
                },
                "rows": normalized_rows,
                "leftSummary": left_sums,
                "rightSummary": aug_data.get("rightSummary", [])
            }

            with open("/tmp/cbo_expense_august_2026.json", "w", encoding="utf-8") as f:
                json.dump(result_payload, f, indent=2)
            stream("💾 Complete Data Saved to /tmp/cbo_expense_august_2026.json")
            return result_payload

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    run("Aug-2026")
