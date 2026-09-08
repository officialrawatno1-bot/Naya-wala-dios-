import os, sys

# 1. Update expense_engine.py with strict Syncfusion DatePicker Binding
expense_engine_code = """import os, sys, time, json, traceback
from datetime import datetime
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"

def fetch_cbo_expense(target_month="Aug-2026"):
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

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(45000)
            page.on("dialog", lambda d: d.accept())

            # 1. Login
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
            page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)

            # 2. SFA -> Expense Statement
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(3500)

            # 3. 🌟 STRICT SYNCFUSION EJ2 INSTANCE DATEPICKER BINDING (Sets Real Target Month!)
            first_modal = page.locator("ngb-modal-window, .modal.show, .fullscreen-modal").last
            first_modal.wait_for(state="visible", timeout=20000)

            page.evaluate('''(dates) => {
                const targetDate = new Date(dates.year, dates.m_idx, 1);

                // A. Update all Syncfusion DatePicker instances in DOM
                const allEj2 = Array.from(document.querySelectorAll('*')).filter(e => e.ej2_instances && e.ej2_instances.length > 0);
                allEj2.forEach(el => {
                    el.ej2_instances.forEach(inst => {
                        if (inst.getModuleName && (inst.getModuleName() === 'datepicker' || inst.getModuleName() === 'daterangepicker')) {
                            inst.value = targetDate;
                            if (inst.dataBind) inst.dataBind();
                            if (inst.element) {
                                inst.element.value = dates.query_str;
                                inst.element.dispatchEvent(new Event('input', { bubbles: true }));
                                inst.element.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    });
                });

                // B. Update native selects & inputs
                const inps = Array.from(document.querySelectorAll('input')).filter(i => (i.className || '').includes('datepicker') || (i.value && i.value.includes('/')));
                inps.forEach(i => {
                    i.value = dates.query_str;
                    i.dispatchEvent(new Event('input', { bubbles: true }));
                    i.dispatchEvent(new Event('change', { bubbles: true }));
                });

                // C. Click GO Button
                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
                if (go) go.click();
            }''', {
                'year': year,
                'm_idx': m_idx,
                'm_code': m_code,
                'query_str': query_date_str
            })
            page.wait_for_timeout(3500)

            # 4. Click BANWARI LAL MEENA
            emp_link = first_modal.locator("a:has-text('BANWARI'), a:has-text('0042'), table tbody tr a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate('''() => {
                    const m = document.querySelector('ngb-modal-window') || document;
                    const links = Array.from(m.querySelectorAll('table a, .e-row a, a'));
                    const target = links.find(a => (a.innerText || '').toUpperCase().includes('BANWARI') || (a.innerText || '').includes('0042'));
                    if (target) target.click();
                    else if (links.length > 0) links[0].click();
                }''')

            page.wait_for_timeout(5000)

            # 5. Extract Full Modal DOM Data & Syncfusion Grid
            extracted_data = page.evaluate('''() => {
                const result = {
                    header: {},
                    dailyRows: [],
                    leftSummary: [],
                    rightSummary: []
                };

                // Extract direct from Syncfusion instance
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
            }''')

            browser.close()

            rows = extracted_data.get("dailyRows", [])
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

                # If fareTa is 0 but km > 0, auto-calculate: km * 2.50
                if ta_num == 0 and km_num > 0:
                    ta_num = round(km_num * 2.50, 2)

                # If daAmt is 0 but DA Type is set, auto-calculate:
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

            return {
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
                    "grandClaim": tot_ta + tot_da + 270.0
                },
                "rows": normalized_rows,
                "leftSummary": extracted_data.get("leftSummary", []),
                "rightSummary": extracted_data.get("rightSummary", [])
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "month": target_month
        }
"""

with open('expense_engine.py', 'w', encoding='utf-8') as f:
    f.write(expense_engine_code)
print("✅ expense_engine.py updated with strict Syncfusion DatePicker Binding.")

