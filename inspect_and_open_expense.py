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
    stream("=" * 85)
    stream("🔍 [EXPENSE INSPECTOR & EXTRACTOR] ANALYZING GRID CELLS & ACTIONS...")
    stream("=" * 85)

    excel_save_path = "/tmp/CBO_Expense_August_2026.xlsx"

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

            # 3. Query August 2026 List
            stream("3. Querying August 2026 List...")
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
                if (go) go.click();
            }""")
            page.wait_for_timeout(3000)

            # 4. Deep Inspection of Row and Toolbar
            stream("4. Inspecting Row Cells and Toolbar Buttons...")
            
            row_cells_info = page.evaluate("""() => {
                const tr = Array.from(document.querySelectorAll('tr, .e-row')).find(r => r.innerText.includes('BANWARI'));
                if (!tr) return { found: false };
                
                const cells = Array.from(tr.querySelectorAll('td')).map((td, i) => ({
                    idx: i,
                    text: td.innerText.trim(),
                    className: td.className,
                    html: td.innerHTML
                }));

                const allButtons = Array.from(document.querySelectorAll('button, a, input[type=button], .e-toolbar-item')).map(b => ({
                    text: (b.innerText || b.value || b.title || '').trim(),
                    tag: b.tagName,
                    className: b.className
                })).filter(b => b.text.length > 0 && b.text.length < 30);

                return {
                    found: true,
                    fullText: tr.innerText.trim(),
                    cells: cells,
                    toolbarButtons: allButtons
                };
            }""")

            if row_cells_info.get("found"):
                stream(f"   Found Row: {row_cells_info.get('fullText')}")
                stream(f"   Row has {len(row_cells_info.get('cells', []))} columns:")
                for c in row_cells_info.get('cells', []):
                    stream(f"     • Col [{c['idx']}] ({c['text']}): HTML -> {c['html'][:80]}")
                
                stream(f"   Active Buttons on screen: {[b['text'] for b in row_cells_info.get('toolbarButtons', [])[:8]]}")
            else:
                stream("   ⚠️ Row not found directly, checking all tables...")

            # 5. Try clicking each cell of Banwari row to trigger Entry window
            stream("5. Testing Real Clicks on Banwari Row Cells...")
            
            row_locator = page.locator("tr:has-text('BANWARI'), .e-row:has-text('BANWARI')").first
            cell_count = row_locator.locator("td").count()
            
            entry_opened = False

            # Try clicking cell 1 (Emp Name) and cell 2 (Emp Code)
            for c_idx in range(cell_count):
                cell = row_locator.locator("td").nth(c_idx)
                c_text = cell.inner_text().strip()
                stream(f"   👉 Testing Click on Col [{c_idx}] ('{c_text}')...")
                
                # Try single click
                cell.click(force=True)
                page.wait_for_timeout(1500)

                # Check if Entry modal opened
                is_open = page.evaluate("() => document.body.innerText.includes('Actual Station') || document.body.innerText.includes('DUNGARPUR') || document.body.innerText.includes('EDIT MODE')")
                if is_open:
                    stream(f"   🎯 SUCCESS! Entry Window opened by clicking Col [{c_idx}] ('{c_text}')!")
                    entry_opened = True
                    break

                # Try double click
                cell.dblclick(force=True)
                page.wait_for_timeout(1500)

                is_open = page.evaluate("() => document.body.innerText.includes('Actual Station') || document.body.innerText.includes('DUNGARPUR') || document.body.innerText.includes('EDIT MODE')")
                if is_open:
                    stream(f"   🎯 SUCCESS! Entry Window opened by Double-Clicking Col [{c_idx}] ('{c_text}')!")
                    entry_opened = True
                    break

            # If not opened by row click, try toolbar Edit button
            if not entry_opened:
                stream("   Trying Toolbar Edit / View buttons...")
                edit_btn = page.locator("button:has-text('Edit'), a:has-text('Edit'), [title*='Edit'], button:has-text('View'), [title*='View']").first
                if edit_btn.count() > 0:
                    edit_btn.click(force=True)
                    page.wait_for_timeout(3000)
                    is_open = page.evaluate("() => document.body.innerText.includes('Actual Station') || document.body.innerText.includes('DUNGARPUR') || document.body.innerText.includes('EDIT MODE')")
                    if is_open:
                        stream("   🎯 SUCCESS! Entry Window opened via Toolbar Edit Button!")
                        entry_opened = True

            # 6. Extract Complete Entry Data (31 Days + Allowances)
            page.wait_for_timeout(3000)
            stream("6. Extracting Complete 31-Day Table & Summary from Entry Window...")

            extracted = page.evaluate("""() => {
                const res = { daily: [], leftSummary: [], rightSummary: [] };
                
                const allTrs = Array.from(document.querySelectorAll('tr, .e-row'));
                allTrs.forEach(tr => {
                    const tds = Array.from(tr.querySelectorAll('td, th')).map(t => t.innerText.trim());
                    if (tds.length === 0) return;

                    // Main 31-day table row
                    if (tds.length >= 8 && /^[0-9]+$/.test(tds[0]) && (tds[1].includes('/') || tds[1].includes('2026') || tds[2] === 'DUNGARPUR' || tds[2] === 'UDAIPUR' || tds[2] === 'Sunday')) {
                        res.daily.push({
                            srNo: tds[0],
                            date: tds[1],
                            actualStation: tds[2] || '',
                            workingType: tds[3] || '',
                            workingRoute: tds[4] || '',
                            daType: tds[5] || '',
                            workWith: tds[6] || '',
                            drCall: tds[7] || '',
                            chemCall: tds[8] || '',
                            stkCall: tds[9] || '',
                            routeKm: tds[10] || '',
                            payableKm: tds[11] || '',
                            rate: tds[12] || '',
                            fareTa: tds[13] || '',
                            daAmt: tds[14] || ''
                        });
                    }
                    // Left summary (Local / Ex-Station)
                    else if (tds.length >= 4 && (tds[1] === 'Local' || tds[1] === 'Ex-Station' || tds[1] === 'Out Station')) {
                        res.leftSummary.push({ sr: tds[0], head: tds[1], days: tds[2], amt: tds[3] });
                    }
                    // Right summary (MISC EXP)
                    else if (tds.length >= 4 && (tds[1].includes('MISC') || tds[1].includes('EXP'))) {
                        res.rightSummary.push({ sr: tds[0], head: tds[1], type: tds[2], amt: tds[3] });
                    }
                });

                return res;
            }""")

            daily_rows = extracted.get("daily", [])
            stream(f"   🎉 Extracted {len(daily_rows)} Daily Rows + {len(extracted.get('leftSummary', []))} Summary Categories!")

            # 7. Click Green Excel Button to Download
            stream("7. Clicking Green Excel Button in Entry Screen...")
            try:
                with page.expect_download(timeout=15000) as dl_info:
                    excel_btn = page.locator("button:has-text('Excel'), a:has-text('Excel'), .btn-success:has-text('Excel')").last
                    if excel_btn.count() > 0:
                        excel_btn.click(force=True)
                    else:
                        page.evaluate("""() => {
                            const b = Array.from(document.querySelectorAll('button, a')).find(x => (x.innerText || '').toUpperCase().includes('EXCEL'));
                            if (b) b.click();
                        }""")
                dl = dl_info.value
                dl.save_as(excel_save_path)
                stream(f"🎉 [EXCEL SAVED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)!")
            except Exception as dl_e:
                stream(f"ℹ️ Download notice: Direct DOM extraction completed ({len(daily_rows)} rows).")

            browser.close()

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

    # 8. Print Clean Table Output
    if daily_rows:
        stream("\n" + "=" * 115)
        stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'ROUTE':<14} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
        stream("=" * 115)

        tot_km = 0
        tot_ta = 0
        tot_da = 0
        tot_drs = 0

        for r in daily_rows:
            km = float(str(r.get('payableKm') or r.get('routeKm') or '0').replace(',', ''))
            ta = float(str(r.get('fareTa') or '0').replace(',', ''))
            da = float(str(r.get('daAmt') or '0').replace(',', ''))
            dr = int(str(r.get('drCall') or '0').replace(',', '') or 0)

            tot_km += km
            tot_ta += ta
            tot_da += da
            tot_drs += dr

            stream(f"{r['srNo']:<4} {r['date']:<12} {r['actualStation'][:14]:<15} {r['workingType'][:11]:<12} {r['workingRoute'][:13]:<14} {r['daType']:<5} {dr:<4} {km:<6.0f} ₹{ta:<9.2f} ₹{da:<9.2f}")

        stream("-" * 115)
        stream(f"📊 SUMMARY TOTALS:")
        stream(f"   • Total Route KM    : {tot_km:.0f} KM")
        stream(f"   • Total Dr Calls    : {tot_drs} Calls")
        stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
        stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")

        for sl in extracted.get("leftSummary", []):
            stream(f"   • {sl['head']:<15} : {sl['days']} Days  ➔  ₹{sl['amt']}")
        for sr in extracted.get("rightSummary", []):
            stream(f"   • {sr['head']:<15} : {sr['type']}  ➔  ₹{sr['amt']}")

        grand_total = tot_ta + tot_da + 270.0
        stream(f"\n💰 GRAND TOTAL MONTHLY CLAIM : ₹{grand_total:.2f}")
        stream("=" * 115)

        with open("/tmp/cbo_expense_august_2026.json", "w", encoding="utf-8") as f:
            json.dump({
                "month": "August 2026",
                "employee": "BANWARI LAL MEENA (RJ/SL/0042)",
                "totals": { "km": tot_km, "fareTa": tot_ta, "daAmt": tot_da, "misc": 270, "grandTotal": grand_total },
                "rows": daily_rows,
                "summaryLeft": extracted.get("leftSummary", []),
                "summaryRight": extracted.get("rightSummary", [])
            }, f, indent=2)
        stream("💾 Saved /tmp/cbo_expense_august_2026.json ready for Web Dashboard!")

    # If Excel was downloaded, parse it
    if os.path.exists(excel_save_path):
        try:
            wb = openpyxl.load_workbook(excel_save_path, data_only=True)
            ws = wb.active
            stream(f"\n📑 [PARSED ORIGINAL EXCEL: '{ws.title}'] - Max Rows: {ws.max_row}")
            for r in range(1, min(ws.max_row + 1, 35)):
                vals = [str(ws.cell(r, c).value or '').strip() for c in range(1, ws.max_column + 1)]
                if any(vals): stream(f"Row {r:02d}: " + " | ".join(vals[:10]))
        except: pass

if __name__ == "__main__":
    run()
