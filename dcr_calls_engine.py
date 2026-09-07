import os, sys, time, re, threading, calendar
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"

EXTRACTION_TASKS = {}
TASK_MUTEX = threading.Lock()

def get_task_state(task_id):
    if task_id not in EXTRACTION_TASKS:
        return {
            "status": "idle",
            "percent": 0,
            "step": "Ready for live extraction",
            "doctors_count": 0,
            "chemists_count": 0,
            "logs": [],
            "error": None,
            "doctors": [],
            "chemists": [],
            "missed_dates": []
        }
    return EXTRACTION_TASKS[task_id]

def split_date_range(from_str, to_str):
    f_dt = datetime.strptime(from_str.strip(), "%d/%m/%Y")
    t_dt = datetime.strptime(to_str.strip(), "%d/%m/%Y")
    
    chunks = []
    curr = f_dt
    while curr <= t_dt:
        _, last_day = calendar.monthrange(curr.year, curr.month)
        if curr.day <= 15:
            part_end = min(curr.replace(day=15), t_dt)
            chunks.append((curr.strftime("%d/%m/%Y"), part_end.strftime("%d/%m/%Y")))
            curr = part_end + timedelta(days=1)
        else:
            month_end = curr.replace(day=last_day)
            part_end = min(month_end, t_dt)
            chunks.append((curr.strftime("%d/%m/%Y"), part_end.strftime("%d/%m/%Y")))
            curr = part_end + timedelta(days=1)
    return chunks

def login_and_open_report(page, log_fn):
    log_fn(f"Logging in to CBO ERP ({CBO_USER})...")
    page.goto("https://dios.myreporting.net/", timeout=60000, wait_until="domcontentloaded")
    time.sleep(1.5)

    page.fill("input[type='text']:visible", CBO_USER)
    page.fill("input[type='password']:visible", CBO_PASS)
    time.sleep(0.5)

    sign_btn = page.locator("button:has-text('Sign In'), button:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first
    if sign_btn.count() > 0:
        sign_btn.click()
    else:
        page.keyboard.press("Enter")

    time.sleep(2)

    page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
        const ok = btns.find(b => {
            const t = (b.innerText || b.value || '').trim().toUpperCase();
            return t === 'YES' || t === 'OK' || t.includes('CONTINUE') || t.includes('TERMINATE');
        });
        if (ok) ok.click();
    }""")

    try:
        page.wait_for_selector("#ej2-menu_1, a:has-text('Reports'), span:has-text('Reports'), .e-menu-wrapper", timeout=20000)
    except Exception:
        pass

    time.sleep(1.5)
    log_fn("Authentication Successful.")

    log_fn("Opening Date Wise Call Detail Report...")
    page.locator("a:has-text('Reports'), span:has-text('Reports')").first.click()
    time.sleep(0.8)
    page.locator("a:has-text('DCR Reports'), span:has-text('DCR Reports')").first.click()
    time.sleep(0.8)
    page.locator("a:has-text('Date Wise Call Detail'), span:has-text('Date Wise Call Detail')").first.click()
    time.sleep(3)

def set_dates_and_query(page, from_str, to_str, log_fn):
    f_dt = datetime.strptime(from_str, "%d/%m/%Y")
    t_dt = datetime.strptime(to_str, "%d/%m/%Y")

    log_fn(f"Setting Date Range: {from_str} to {to_str}...")
    
    # 🌟 ROCK-SOLID SYNCFUSION DATE APPLIER (Prevents 0 Days bug on 16-31 July)
    page.evaluate("""(dates) => {
        const dFrom = new Date(dates.f_yr, dates.f_mo - 1, dates.f_da);
        const dTo = new Date(dates.t_yr, dates.t_mo - 1, dates.t_da);

        const seenPickers = new Set();
        const pickers = [];
        document.querySelectorAll('*').forEach(el => {
            if (el.ej2_instances && el.ej2_instances.length > 0) {
                el.ej2_instances.forEach(inst => {
                    if (inst.getModuleName && inst.getModuleName() === 'datepicker') {
                        const id = inst.element ? inst.element.id : (inst.id || el.id);
                        if (!seenPickers.has(id)) {
                            seenPickers.add(id);
                            pickers.push(inst);
                        }
                    }
                });
            }
        });

        if (pickers.length >= 2) {
            pickers[0].value = dFrom;
            if (pickers[0].dataBind) pickers[0].dataBind();
            if (pickers[0].element) pickers[0].element.value = dates.from_str;

            pickers[1].value = dTo;
            if (pickers[1].dataBind) pickers[1].dataBind();
            if (pickers[1].element) pickers[1].element.value = dates.to_str;
        } else {
            const inputs = Array.from(document.querySelectorAll('input')).filter(i => {
                return i.type !== 'hidden' && i.offsetWidth > 0 && ((i.className || '').includes('datepicker') || (i.value && i.value.includes('/')));
            });
            if (inputs.length >= 2) {
                inputs[0].value = dates.from_str;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[1].value = dates.to_str;
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }""", {
        'from_str': from_str, 'to_str': to_str,
        'f_yr': f_dt.year, 'f_mo': f_dt.month, 'f_da': f_dt.day,
        't_yr': t_dt.year, 't_mo': t_dt.month, 't_da': t_dt.day
    })

    time.sleep(1)
    log_fn("Querying CBO (Clicking GO)...")
    page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('button, input[type=button], input[type=submit], a'));
        const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
        if (go) go.click();
    }""")
    time.sleep(6)

def parse_modal_data(page):
    return page.evaluate("""() => {
        const res = { doctors: [], chemists: [] };
        const popups = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, ngb-modal-window, .modal')).filter(m => !m.classList.contains('fullscreen-modal'));
        if (popups.length === 0) return res;

        const lastModal = popups[popups.length - 1];
        const allRows = Array.from(lastModal.querySelectorAll('tr'));
        allRows.forEach(tr => {
            const cols = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
            if (cols.length === 0 || cols[0].toLowerCase().includes('no records')) return;
            if (cols.length >= 10 && /^[0-9]+$/.test(cols[0]) && cols[2].length > 1) {
                res.doctors.push(cols);
            } else if (cols.length >= 5 && cols.length < 10 && /^[0-9]+$/.test(cols[0]) && cols[1].length > 1) {
                res.chemists.push(cols);
            }
        });
        return res;
    }""")

def close_modal_natural(page):
    page.evaluate("""() => {
        const modals = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, ngb-modal-window, .modal')).filter(m => !m.classList.contains('fullscreen-modal'));
        if (modals.length > 0) {
            const lastModal = modals[modals.length - 1];
            const closeBtn = lastModal.querySelector('button.close, .btn-close, .modal-header button');
            if (closeBtn) closeBtn.click();
        }
    }""")
    page.keyboard.press("Escape")
    time.sleep(1.2)

def recover_single_date(m_info, log_fn):
    m_date = m_info["date"]
    exp = m_info.get("expected", 0)
    
    recovered_docs = []
    recovered_chems = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.on('dialog', lambda d: d.accept())

        login_and_open_report(page, log_fn)
        set_dates_and_query(page, m_date, m_date, log_fn)

        time.sleep(2.5)

        clicked = page.evaluate("""(tDate) => {
            const t5 = document.querySelector('.e-frozencontent table') || document.querySelectorAll('table')[4];
            if (!t5) return false;
            for (let i = 0; i < t5.rows.length; i++) {
                const r = t5.rows[i];
                const dateCell = r.cells[4] || r.cells[3];
                if (dateCell && dateCell.innerText.trim() === tDate) {
                    r.scrollIntoView({ block: 'center' });
                    const link = dateCell.querySelector('a') || r.querySelector('a');
                    if (link) {
                        link.click();
                        return true;
                    }
                }
            }
            return false;
        }""", m_date)

        if not clicked:
            try:
                date_link = page.locator(f"table tr:has-text('{m_date}') a").first
                if date_link.count() > 0:
                    date_link.scroll_into_view_if_needed()
                    date_link.click(force=True)
                    clicked = True
            except Exception:
                pass

        log_fn(f"     ⏳ Waiting for CBO modal records for {m_date}...")
        time.sleep(5)

        details_data = parse_modal_data(page)
        day_docs = details_data.get('doctors', [])

        for d_cols in day_docs:
            doc_raw = d_cols[2] if len(d_cols) > 2 else ""
            doc_code = ""
            doc_name = doc_raw
            m = re.search(r'\((.*?)\)', doc_raw)
            if m:
                doc_code = m.group(1).strip()
                doc_name = re.sub(r'\(.*?\)', '', doc_raw).strip()

            recovered_docs.append({
                "date": m_date,
                "day": m_info.get('day', ''),
                "station": m_info.get('station', 'UDAIPUR'),
                "route": m_info.get('route', ''),
                "workWith": d_cols[9] if len(d_cols) > 9 else m_info.get('workWith', ''),
                "srNo": d_cols[0] if len(d_cols) > 0 else "",
                "docName": doc_name,
                "docCode": doc_code,
                "speciality": d_cols[5] if len(d_cols) > 5 else "",
                "area": d_cols[4] if len(d_cols) > 4 else m_info.get('station', 'UDAIPUR'),
                "visitTime": d_cols[7] if len(d_cols) > 7 else "",
                "prodSample": d_cols[10] if len(d_cols) > 10 else "",
                "gift": d_cols[11] if len(d_cols) > 11 else "",
                "rxQty": d_cols[12] if len(d_cols) > 12 else "",
                "pobAmt": d_cols[14] if len(d_cols) > 14 else "0",
                "callType": d_cols[15] if len(d_cols) > 15 else "P",
                "remarks": d_cols[13] if len(d_cols) > 13 else ""
            })

        for c_cols in details_data.get('chemists', []):
            recovered_chems.append({
                "date": m_date,
                "day": m_info.get('day', ''),
                "station": m_info.get('station', 'UDAIPUR'),
                "srNo": c_cols[0] if len(c_cols) > 0 else "",
                "chemistName": c_cols[1] if len(c_cols) > 1 else "",
                "address": c_cols[2] if len(c_cols) > 2 else "",
                "visitTime": c_cols[3] if len(c_cols) > 3 else "",
                "products": c_cols[4] if len(c_cols) > 4 else "",
                "pobAmt": c_cols[6] if len(c_cols) > 6 else "0",
                "remarks": c_cols[7] if len(c_cols) > 7 else ""
            })

        close_modal_natural(page)
        browser.close()

    return recovered_docs, recovered_chems

def extract_part(p_from, p_to, log_fn, update_progress_fn):
    f_dt = datetime.strptime(p_from, "%d/%m/%Y")
    t_dt = datetime.strptime(p_to, "%d/%m/%Y")

    with sync_playwright() as p:
        log_fn(f"Launching fresh browser engine for ({p_from} to {p_to})...")
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.on('dialog', lambda d: d.accept())

        login_and_open_report(page, log_fn)
        set_dates_and_query(page, p_from, p_to, log_fn)

        time.sleep(2.5)

        daily_rows = page.evaluate("""() => {
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
                    const workedRoute = r6.cells[6] ? r6.cells[6].innerText.trim() : '';
                    const actualStation = r6.cells[9] ? r6.cells[9].innerText.trim() : '';
                    const drCalls = r6.cells[17] ? r6.cells[17].innerText.trim() : '0';
                    const workWith = r6.cells[31] ? r6.cells[31].innerText.trim() : '';

                    if (date && date.includes('/')) {
                        rowsData.push({
                            index: i,
                            date: date,
                            day: day,
                            workType: workType,
                            workedRoute: workedRoute,
                            actualStation: actualStation,
                            drCalls: parseInt(drCalls) || 0,
                            workWith: workWith
                        });
                    }
                }
            }
            return rowsData;
        }""")

        valid_days = []
        for d in daily_rows:
            try:
                d_dt = datetime.strptime(d['date'].strip(), "%d/%m/%Y")
                if f_dt <= d_dt <= t_dt and d['workType'] == 'Working' and d['drCalls'] > 0:
                    valid_days.append(d)
            except Exception:
                continue

        log_fn(f"Found {len(valid_days)} working days for {p_from} -> {p_to} (Expected: {sum(d['drCalls'] for d in valid_days)} Doctors).")

        part_doctors = []
        part_chemists = []
        missed_dates = []

        for w_idx, day_info in enumerate(valid_days):
            target_date = day_info['date']
            station = day_info['actualStation'] or day_info['workedRoute'] or "UDAIPUR"
            exp = day_info['drCalls']

            update_progress_fn(w_idx + 1, len(valid_days))
            log_fn(f"[{w_idx+1}/{len(valid_days)}] 📅 Date: {target_date} ({station}) -> Expected: {exp} Doctors...")

            try:
                clicked = page.evaluate("""(tDate) => {
                    const t5 = document.querySelector('.e-frozencontent table') || document.querySelectorAll('table')[4];
                    if (!t5) return false;
                    for (let i = 0; i < t5.rows.length; i++) {
                        const r = t5.rows[i];
                        const dateCell = r.cells[4] || r.cells[3];
                        if (dateCell && dateCell.innerText.trim() === tDate) {
                            r.scrollIntoView({ block: 'center', behavior: 'instant' });
                            const link = dateCell.querySelector('a') || r.querySelector('a');
                            if (link) {
                                link.click();
                                return true;
                            }
                        }
                    }
                    return false;
                }""", target_date)

                if not clicked:
                    date_link = page.locator(f"table tr:has-text('{target_date}') a").first
                    if date_link.count() > 0:
                        date_link.scroll_into_view_if_needed()
                        date_link.click(force=True)

                time.sleep(3.5)
                details_data = parse_modal_data(page)
                day_docs = details_data.get('doctors', [])

                if exp > 0 and len(day_docs) == 0:
                    log_fn(f"     ⚠️ Empty modal for {target_date} on first try (0/{exp}). In-place retry...")
                    close_modal_natural(page)
                    time.sleep(1.5)

                    try:
                        date_link = page.locator(f"table tr:has-text('{target_date}') a").first
                        if date_link.count() > 0:
                            date_link.scroll_into_view_if_needed()
                            date_link.click(force=True)
                            time.sleep(4.5)
                            details_data = parse_modal_data(page)
                            day_docs = details_data.get('doctors', [])
                    except Exception:
                        pass

                if exp > 0 and len(day_docs) < exp:
                    log_fn(f"     📌 [QUEUED FOR RECOVERY] Date {target_date}: Got {len(day_docs)}/{exp} Doctors.")
                    missed_dates.append({
                        "date": target_date,
                        "expected": exp,
                        "extracted": len(day_docs),
                        "day": day_info['day'],
                        "station": station,
                        "route": day_info['workedRoute'],
                        "workWith": day_info['workWith']
                    })

                for d_cols in day_docs:
                    doc_raw = d_cols[2] if len(d_cols) > 2 else ""
                    doc_code = ""
                    doc_name = doc_raw
                    m = re.search(r'\((.*?)\)', doc_raw)
                    if m:
                        doc_code = m.group(1).strip()
                        doc_name = re.sub(r'\(.*?\)', '', doc_raw).strip()

                    part_doctors.append({
                        "date": target_date,
                        "day": day_info['day'],
                        "station": station,
                        "route": day_info['workedRoute'],
                        "workWith": d_cols[9] if len(d_cols) > 9 else day_info['workWith'],
                        "srNo": d_cols[0] if len(d_cols) > 0 else "",
                        "docName": doc_name,
                        "docCode": doc_code,
                        "speciality": d_cols[5] if len(d_cols) > 5 else "",
                        "area": d_cols[4] if len(d_cols) > 4 else station,
                        "visitTime": d_cols[7] if len(d_cols) > 7 else "",
                        "prodSample": d_cols[10] if len(d_cols) > 10 else "",
                        "gift": d_cols[11] if len(d_cols) > 11 else "",
                        "rxQty": d_cols[12] if len(d_cols) > 12 else "",
                        "pobAmt": d_cols[14] if len(d_cols) > 14 else "0",
                        "callType": d_cols[15] if len(d_cols) > 15 else "P",
                        "remarks": d_cols[13] if len(d_cols) > 13 else ""
                    })

                for c_cols in details_data.get('chemists', []):
                    part_chemists.append({
                        "date": target_date,
                        "day": day_info['day'],
                        "station": station,
                        "srNo": c_cols[0] if len(c_cols) > 0 else "",
                        "chemistName": c_cols[1] if len(c_cols) > 1 else "",
                        "address": c_cols[2] if len(c_cols) > 2 else "",
                        "visitTime": c_cols[3] if len(c_cols) > 3 else "",
                        "products": c_cols[4] if len(c_cols) > 4 else "",
                        "pobAmt": c_cols[6] if len(c_cols) > 6 else "0",
                        "remarks": c_cols[7] if len(c_cols) > 7 else ""
                    })

                log_fn(f"     ✅ {target_date}: Extracted {len(day_docs)}/{exp} Doctors.")
                close_modal_natural(page)

            except Exception as day_err:
                log_fn(f"     ❌ Error on {target_date}: {day_err}. Queued for recovery.")
                missed_dates.append({
                    "date": target_date, "expected": exp, "extracted": 0,
                    "day": day_info['day'], "station": station, "route": day_info['workedRoute'], "workWith": day_info['workWith']
                })
                close_modal_natural(page)

        browser.close()
        log_fn(f"Batch ({p_from} to {p_to}) complete ({len(part_doctors)} doctors). Closed browser cleanly.")
        return part_doctors, part_chemists, missed_dates

def run_extraction_background(from_date="01/04/2026", to_date="30/09/2026", task_id="default"):
    chunks = split_date_range(from_date, to_date)
    task = {
        "status": "running",
        "percent": 5,
        "step": f"Starting extraction ({len(chunks)} Batches planned)...",
        "doctors_count": 0,
        "chemists_count": 0,
        "logs": [f"🚀 Starting Extraction for {from_date} to {to_date} ({len(chunks)} batches)..."],
        "error": None,
        "doctors": [],
        "chemists": [],
        "missed_dates": []
    }
    EXTRACTION_TASKS[task_id] = task

    def log(msg):
        task["logs"].append(f"[{time.strftime('%H:%M:%S')}] {msg}")
        task["step"] = msg

    try:
        all_final_doctors = []
        all_final_chemists = []
        all_missed_dates = []

        for p_idx, (p_from, p_to) in enumerate(chunks):
            part_num = p_idx + 1
            log(f"\n=======================================================")
            log(f"🚀 BATCH [{part_num}/{len(chunks)}]: Running {p_from} to {p_to} (Fresh Session)...")
            log(f"=======================================================")

            if p_idx > 0:
                log("Waiting 3s session cooldown before next batch...")
                time.sleep(3)

            def update_progress(current_day, total_days):
                base_pct = int((p_idx / len(chunks)) * 90)
                chunk_pct = int((current_day / max(1, total_days)) * (90 // len(chunks)))
                task["percent"] = min(95, base_pct + chunk_pct)

            docs, chems, missed = extract_part(p_from, p_to, log, update_progress)
            all_final_doctors.extend(docs)
            all_final_chemists.extend(chems)
            all_missed_dates.extend(missed)
            
            task["doctors_count"] = len(all_final_doctors)
            task["chemists_count"] = len(all_final_chemists)
            task["missed_dates"] = all_missed_dates

            log(f"✅ Batch [{part_num}/{len(chunks)}] complete: {len(docs)} Doctors extracted! (Running Total: {len(all_final_doctors)})")

        try:
            all_final_doctors.sort(key=lambda d: datetime.strptime(d["date"], "%d/%m/%Y"))
        except Exception:
            pass

        task["percent"] = 100
        task["status"] = "completed"
        task["step"] = f"Extraction Finished! Extracted {len(all_final_doctors)} Doctors & {len(all_final_chemists)} Chemists."
        task["doctors"] = all_final_doctors
        task["chemists"] = all_final_chemists
        task["missed_dates"] = all_missed_dates

        if len(all_missed_dates) > 0:
            log(f"\n⚠️ [ACTION REQUIRED] {len(all_missed_dates)} dates had missing data. Click 'Re-Fetch Missed Dates' button on screen to complete!")
        else:
            log(f"\n🎉 100% COMPLETE! All dates extracted with zero missing data!")

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        task["step"] = f"Error: {str(e)}"
        task["logs"].append(f"❌ ERROR: {str(e)}")

def run_recovery_background(missed_list, task_id):
    task = EXTRACTION_TASKS.get(task_id)
    if not task:
        task = {
            "status": "running",
            "percent": 10,
            "step": "Starting recovery...",
            "doctors": [],
            "chemists": [],
            "logs": [],
            "error": None,
            "missed_dates": []
        }
        EXTRACTION_TASKS[task_id] = task

    task["status"] = "running"
    task["percent"] = 15
    task["step"] = f"Starting recovery for {len(missed_list)} missed dates..."

    def log(msg):
        task["logs"].append(f"[{time.strftime('%H:%M:%S')}] {msg}")
        task["step"] = msg

    try:
        log(f"\n=======================================================")
        log(f"🔄 [1-CLICK RECOVERY] Processing {len(missed_list)} dates individually with dedicated browser sessions...")
        log(f"=======================================================")

        recovered_docs = []
        recovered_chems = []
        still_missed = []

        total_missed = len(missed_list)
        for m_idx, m_info in enumerate(missed_list):
            m_date = m_info["date"]
            exp = m_info.get("expected", 0)

            if m_idx > 0:
                log("Waiting 3s before next recovery session...")
                time.sleep(3)

            pct = 15 + int(((m_idx + 1) / total_missed) * 80)
            task["percent"] = pct

            docs, chems = recover_single_date(m_info, log)
            
            if len(docs) > 0:
                recovered_docs.extend(docs)
                recovered_chems.extend(chems)
                log(f"     🎉 [RECOVERED SUCCESS] Fetched {len(docs)}/{exp} Doctors for {m_date}!")
            else:
                log(f"     ⚠️ [FAILED] Still 0 records for {m_date}.")
                still_missed.append(m_info)

        existing_docs = [d for d in task.get("doctors", []) if d.get("date") not in [m["date"] for m in missed_list if m not in still_missed]]
        existing_chems = [c for c in task.get("chemists", []) if c.get("date") not in [m["date"] for m in missed_list if m not in still_missed]]
        
        merged_docs = existing_docs + recovered_docs
        merged_chems = existing_chems + recovered_chems

        seen_keys = set()
        unique_docs = []
        for d in merged_docs:
            k = (d.get("date"), d.get("docName"), d.get("visitTime"))
            if k not in seen_keys:
                seen_keys.add(k)
                unique_docs.append(d)

        try:
            unique_docs.sort(key=lambda d: datetime.strptime(d["date"], "%d/%m/%Y"))
        except Exception:
            pass

        task["doctors"] = unique_docs
        task["chemists"] = merged_chems
        task["doctors_count"] = len(unique_docs)
        task["chemists_count"] = len(merged_chems)
        task["missed_dates"] = still_missed
        task["percent"] = 100
        task["status"] = "completed"
        task["step"] = f"Recovery Complete! Total: {len(unique_docs)} Doctors"
        log(f"\n🎉 RECOVERY COMPLETED! New Master Total: {len(unique_docs)} Doctors.")

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        task["step"] = f"Recovery Error: {str(e)}"
        task["logs"].append(f"❌ ERROR: {str(e)}")

def start_task(from_date, to_date):
    with TASK_MUTEX:
        task_id = f"{from_date}_{to_date}"
        t = threading.Thread(target=run_extraction_background, args=(from_date, to_date, task_id), daemon=True)
        t.start()
        return {"success": True, "message": "Extraction started", "taskId": task_id, "fromDate": from_date, "toDate": to_date}

def start_recovery_task(missed_list, task_id):
    with TASK_MUTEX:
        t = threading.Thread(target=run_recovery_background, args=(missed_list, task_id), daemon=True)
        t.start()
        return {"success": True, "message": "Recovery started", "taskId": task_id}
