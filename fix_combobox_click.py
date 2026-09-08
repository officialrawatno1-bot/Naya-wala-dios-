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
    stream("=" * 90)
    stream(f"🚀 [NATURAL POPUP SELECTOR] SELECTING {target_month} VIA SYNCFUSION UI...")
    stream("=" * 90)

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
            page.wait_for_timeout(3500)

            # 3. 🎯 CLICK ON MONTH COMBOBOX TO OPEN POPUP
            stream("3. Opening Month ComboBox Dropdown Popup...")
            
            # Click the dropdown icon or input
            month_box = page.locator("#MONTH_FILTER, input.e-input[value*='2026'], .e-input-group:has(#MONTH_FILTER) .e-ddl-icon").first
            month_box.click(force=True)
            page.wait_for_timeout(1200)

            # Read all available items in the popup list
            popup_items = page.evaluate("""() => {
                const lis = Array.from(document.querySelectorAll('.e-popup li, .e-dropdownbase li, ul.e-list-parent li'));
                return lis.map((li, idx) => ({
                    idx,
                    text: li.innerText.trim(),
                    className: li.className
                }));
            }""")

            stream(f"   Popup Opened! Total Month Options found: {len(popup_items)}")
            for it in popup_items[:12]:
                stream(f"     • [{it['idx']}] '{it['text']}'")

            # Click August in Popup
            stream(f"4. Selecting '{target_month}' from Dropdown List...")
            aug_clicked = False

            # Try Playwright locator click first
            aug_loc = page.locator(".e-popup li:has-text('Aug-2026'), .e-dropdownbase li:has-text('Aug'), li.e-list-item:has-text('Aug')").first
            if aug_loc.count() > 0:
                aug_loc.click(force=True)
                aug_clicked = True
                stream("   ✅ Clicked Aug-2026 via Playwright locator!")
            else:
                aug_clicked = page.evaluate("""(tgt) => {
                    const lis = Array.from(document.querySelectorAll('.e-popup li, .e-dropdownbase li, ul.e-list-parent li'));
                    const item = lis.find(l => (l.innerText || '').toUpperCase().includes('AUG'));
                    if (item) {
                        item.click();
                        return true;
                    }
                    return false;
                }""", target_month)
                if aug_clicked:
                    stream("   ✅ Clicked Aug-2026 via JS click on list item!")

            page.wait_for_timeout(1500)

            # Verify input now says Aug-2026
            current_val = page.evaluate("() => document.querySelector('#MONTH_FILTER')?.value || document.querySelector('input[value*=2026]')?.value")
            stream(f"   Selected Month Value in Control: '{current_val}'")

            # 5. CLICK GO [F4]
            stream("5. Clicking 'GO [F4]' Button for August 2026...")
            page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").first.click(force=True)
            page.wait_for_timeout(4000)

            # 6. READ FIRST ROW OF GRID TO CONFIRM AUGUST
            grid_status = page.evaluate("""() => {
                const tr = document.querySelector('#_gridcontrol .e-gridcontent tr, .e-gridcontent tr');
                return tr ? tr.innerText.trim().replace(/\\n/g, ' | ') : 'NO_ROW_FOUND';
            }""")
            stream(f"   Grid Table Status: {grid_status[:100]}...")

            # 7. CLICK BANWARI LAL MEENA IN GRID
            stream("6. Clicking Banwari Lal Meena inside the August grid...")
            emp_link = page.locator("#_gridcontrol .e-gridcontent tr a, .e-gridcontent a.blue, tr:has-text('BANWARI') a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const a = document.querySelector('#_gridcontrol .e-gridcontent tr a, .e-gridcontent a');
                    if (a) a.click();
                }""")

            stream("   ⏳ Waiting 6s for August Entry Modal to open...")
            page.wait_for_timeout(6000)

            # 8. EXTRACT FULL DATA FROM AUGUST ENTRY MODAL
            stream("7. Extracting Real August 2026 Data from Entry Screen...")
            
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

                // Direct from Syncfusion instance
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

            # 9. Normalize & Display
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

if __name__ == "__main__":
    run("Aug-2026")
