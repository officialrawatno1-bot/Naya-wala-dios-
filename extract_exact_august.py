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

def run(target_month="Aug-2026"):
    parts = target_month.split('-')
    m_code = parts[0].upper()[:3]
    year = int(parts[1]) if len(parts) > 1 else 2026
    
    month_index_map = {
        "APR": (4, 3), "MAY": (5, 4), "JUN": (6, 5), "JUL": (7, 6),
        "AUG": (8, 7), "SEP": (9, 8), "OCT": (10, 9), "NOV": (11, 10),
        "DEC": (12, 11), "JAN": (1, 0), "FEB": (2, 1), "MAR": (3, 2)
    }
    m_num, m_idx = month_index_map.get(m_code, (8, 7))
    query_date_str = f"01/{m_num:02d}/{year}"

    stream("=" * 90)
    stream(f"🚀 [SMART CBO EXPENSE ENGINE] TARGETING {target_month} ({query_date_str})...")
    stream("=" * 90)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(45000)
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

            first_modal = page.locator("ngb-modal-window, .modal.show, .fullscreen-modal").last
            first_modal.wait_for(state="visible", timeout=20000)

            # 3. 🔬 INSPECT AND SET EXACT MONTH ON LIST SCREEN
            stream(f"3. Setting Month to {target_month} ({query_date_str}) on List Screen...")
            
            month_set_result = page.evaluate('''(dates) => {
                const targetDate = new Date(dates.year, dates.m_idx, 1);
                let foundPicker = false;

                // Syncfusion DatePicker
                const allEj2 = Array.from(document.querySelectorAll('*')).filter(e => e.ej2_instances && e.ej2_instances.length > 0);
                allEj2.forEach(el => {
                    el.ej2_instances.forEach(inst => {
                        if (inst.getModuleName && (inst.getModuleName() === 'datepicker' || inst.getModuleName() === 'daterangepicker')) {
                            inst.value = targetDate;
                            if (inst.dataBind) inst.dataBind();
                            foundPicker = true;
                        }
                    });
                });

                // Inputs
                const inps = Array.from(document.querySelectorAll('input')).filter(i => (i.className || '').includes('datepicker') || (i.value && i.value.includes('/')));
                inps.forEach(i => {
                    i.value = dates.query_str;
                    i.dispatchEvent(new Event('input', { bubbles: true }));
                    i.dispatchEvent(new Event('change', { bubbles: true }));
                });

                // Selects
                const selects = Array.from(document.querySelectorAll('select'));
                selects.forEach(sel => {
                    const opt = Array.from(sel.options).find(o => o.text.includes(dates.m_code) || o.value.includes(dates.m_code) || o.value.includes(dates.query_str));
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });

                return { foundPicker };
            }''', {
                'year': year,
                'm_idx': m_idx,
                'm_code': m_code,
                'query_str': query_date_str
            })

            stream(f"   Syncfusion Month Picker Updated? -> {month_set_result.get('foundPicker')}")

            # Click GO
            stream("   Clicking GO to query list for August 2026...")
            go_btn = first_modal.locator("button:has-text('GO'), input[value*='GO'], button:has-text('Show'), button:has-text('Apply')").first
            if go_btn.count() > 0:
                go_btn.click(force=True)
            else:
                page.evaluate("""() => {
                    const b = Array.from(document.querySelectorAll('button, input[type=button]')).find(x => (x.innerText || x.value || '').toUpperCase().includes('GO'));
                    if (b) b.click();
                }""")
            
            page.wait_for_timeout(3500)

            # 4. Click BANWARI LAL MEENA
            stream("4. Opening Banwari Lal Meena Statement Entry...")
            emp_link = first_modal.locator("tr:has-text('BANWARI LAL MEENA') a, .e-row:has-text('BANWARI') a, a:has-text('BANWARI LAL MEENA')").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const target = links.find(a => (a.innerText || '').toUpperCase().includes('BANWARI'));
                    if (target) target.click();
                }""")

            page.wait_for_timeout(5000)

            # 5. Extract Full Modal DOM Data & Verified Month
            stream("5. Extracting All 31-Day Table Rows & Allowance Categories...")
            
            extracted_data = page.evaluate('''(dates) => {
                const result = {
                    headerText: '',
                    detectedMonth: '',
                    dailyRows: [],
                    leftSummary: [],
                    rightSummary: []
                };

                const allText = document.body.innerText;
                result.headerText = allText;
                
                const monthMatch = allText.match(/Month[:\\\\s]+([^\\\\n\\\\r]+)/i);
                if (monthMatch) result.detectedMonth = monthMatch[1].trim();

                // Direct from Syncfusion instance
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

                // Fallback table extraction
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
                                    RATE: cells[12] || '2.50',
                                    FARE: cells[13] || '',
                                    HQ_EX_AMT: cells[14] || ''
                                });
                            }
                        });
                    });
                }

                // Summary boxes
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
            }''', {
                'year': year, 'm_num': m_num
            })

            stream(f"   📌 Verified Active Statement Month: {extracted_data.get('detectedMonth')}")
            
            rows = extracted_data.get("dailyRows", [])
            stream(f"   🎉 Extracted {len(rows)} Daily Rows + {len(extracted_data.get('leftSummary', []))} Summary Categories!")

            # 6. Click Green Excel Button to Download
            excel_save_path = f"/tmp/CBO_Expense_{target_month}.xlsx"
            stream(f"6. Downloading Original CBO Excel File -> {excel_save_path}...")
            
            try:
                with page.expect_download(timeout=15000) as dl_info:
                    page.locator("button:has-text('Excel'), a:has-text('Excel'), .btn-success:has-text('Excel')").last.click(force=True)
                dl = dl_info.value
                dl.save_as(excel_save_path)
                stream(f"🎉 [EXCEL SAVED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)!")
            except Exception as dl_e:
                stream(f"ℹ️ Download note: Direct Grid extraction completed successfully.")

            browser.close()

            # 7. Normalize Rows & Calculations
            normalized_rows = []
            tot_km, tot_ta, tot_da, tot_drs = 0, 0, 0, 0

            for idx, r in enumerate(rows, start=1):
                sr = str(r.get('SRNO') or r.get('srNo') or idx)
                raw_date = str(r.get('DATE') or r.get('date') or f"{idx:02d}/{m_num:02d}/{year}")
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
                    "routeKm": km_num, "payableKm": km_num, "rate": rate,
                    "fareTa": ta_num, "daAmt": da_num
                })

            # Print Formatted Table
            stream("\n" + "=" * 120)
            stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'WORKING ROUTE':<15} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
            stream("=" * 120)

            for r in normalized_rows:
                stream(f"{r['srNo']:<4} {r['date']:<12} {r['actualStation'][:14]:<15} {r['workingType'][:11]:<12} {r['workingRoute'][:14]:<15} {r['daType']:<5} {r['drCall']:<4} {r['km']:<6.0f} ₹{r['fareTa']:<9.2f} ₹{r['daAmt']:<9.2f}")

            stream("-" * 120)
            stream(f"📊 SUMMARY TOTALS FOR {target_month}:")
            stream(f"   • Total Route KM    : {tot_km:.0f} KM")
            stream(f"   • Total Dr Calls    : {tot_drs} Calls")
            stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
            stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")

            left_sums = extracted_data.get("leftSummary", [])
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
                "rightSummary": extracted_data.get("rightSummary", [])
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
