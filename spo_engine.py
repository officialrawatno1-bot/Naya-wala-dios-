import os, sys, time, calendar, json, subprocess
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"

def fetch_spo_data(from_month="Aug-2026"):
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
    excel_output = f"/tmp/spo_{m_code}_{year}.xls"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(50000)
        page.on("dialog", lambda d: d.accept())

        # Login
        page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
        page.wait_for_selector("#ej2-menu_1", timeout=45000)
        page.wait_for_timeout(2000)

        # Navigate
        page.locator("a:has-text('Reports'), span:has-text('Reports')").first.click()
        page.wait_for_timeout(800)
        page.locator("a:has-text('Sales & Targets'), span:has-text('Sales & Targets')").first.click()
        page.wait_for_timeout(800)
        page.locator("a:has-text('SPO Stockist Wise'), span:has-text('SPO Stockist Wise')").first.click()

        report_modal = page.locator("ngb-modal-window.fullscreen-modal, ngb-modal-window").last
        report_modal.wait_for(state="visible", timeout=30000)
        try:
            page.locator(".page-loader-icon").first.wait_for(state="detached", timeout=15000)
        except:
            pass
        page.wait_for_timeout(1500)

        # Filter
        modal_filter = report_modal.locator("a:has(img[src*='filter']), img[src*='filter'], .fa-filter, [title*='Filter']").first
        modal_filter.click(force=True)
        page.wait_for_timeout(2500)

        # Dates
        page.evaluate('''(dates) => {
            const allEj2 = Array.from(document.querySelectorAll('*')).filter(e => e.ej2_instances && e.ej2_instances.length > 0);
            const pickers = allEj2.filter(e => e.ej2_instances[0]?.getModuleName?.() === 'datepicker');
            if (pickers.length >= 2) {
                pickers[0].ej2_instances[0].value = new Date(dates.year, dates.m_idx, 1);
                if (pickers[0].ej2_instances[0].dataBind) pickers[0].ej2_instances[0].dataBind();
                pickers[1].ej2_instances[0].value = new Date(dates.year, dates.m_idx, dates.last_day);
                if (pickers[1].ej2_instances[0].dataBind) pickers[1].ej2_instances[0].dataBind();
            }

            const inputs = Array.from(document.querySelectorAll('input'));
            inputs.forEach(inp => {
                const id = (inp.id || inp.name || '').toUpperCase();
                const parentName = (inp.closest('ejs-datepicker')?.getAttribute('name') || '').toUpperCase();
                const parentId = (inp.closest('ejs-datepicker')?.id || '').toUpperCase();
                const v = (inp.value || '').trim();

                if (id.includes('DATE_FROM') || parentName.includes('DATE_FROM') || parentId.includes('DATE_FROM') || id.includes('FDATE') || v.startsWith('01/09') || v.startsWith('01/')) {
                    if (!id.includes('TO') && !parentName.includes('TO') && !parentId.includes('TO')) {
                        inp.value = dates.from_str;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        inp.dispatchEvent(new Event('change', { bubbles: true }));
                        return;
                    }
                }
                if (id.includes('DATE_TO') || parentName.includes('DATE_TO') || parentId.includes('DATE_TO') || id.includes('TDATE') || (v.includes('/2026') && !v.startsWith('01/'))) {
                    inp.value = dates.to_str;
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }''', {'year': year, 'm_idx': m_num - 1, 'last_day': last_day, 'from_str': from_date_str, 'to_str': to_date_str})

        # GO
        page.evaluate('''() => {
            const btns = Array.from(document.querySelectorAll('.filter-box button, ngb-modal-window button, .modal button, button, input[type=button]'));
            const go = btns.find(b => {
                const t = (b.innerText || b.value || '').trim().toUpperCase();
                return t === 'GO' || t === 'APPLY' || t.includes('SUBMIT') || t === 'GO [F4]';
            });
            if (go) go.click();
        }''')

        page.wait_for_timeout(8000)
        try:
            page.locator(".page-loader-icon").first.wait_for(state="detached", timeout=20000)
        except:
            pass

        # Excel Download
        with page.expect_download(timeout=35000) as dl_info:
            report_modal.locator("a:has(img[src*='excel']), img[src*='excel'], [title*='Excel']").first.click(force=True)

        download = dl_info.value
        download.save_as(excel_output)
        browser.close()

    # Parse Excel
    parse_script = f"""const XLSX = require('xlsx');
const wb = XLSX.readFile('{excel_output}');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {{ header: 1 }});

let totalNetSales = 0;
let totalReturn = 0;
let totalExpiry = 0;
const returnBreakdown = [];
const expiryBreakdown = [];

const parseNum = (v) => {{
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/,/g, '').replace(/₹/g, '').trim());
    return isNaN(n) ? 0 : n;
}};

for (let r = 6; r < rows.length; r++) {{
    const row = rows[r];
    if (!row || row.length < 5) continue;
    const name = String(row[1] || '').trim();
    if (!name || name.toUpperCase().includes('TOTAL')) continue;

    const goodsReturn = parseNum(row[5]);
    const expiry = parseNum(row[9]);
    const netSales = parseNum(row[14]);

    totalReturn += goodsReturn;
    totalExpiry += expiry;
    totalNetSales += netSales;

    if (goodsReturn > 0) {{
        returnBreakdown.push({{
            id: 'sr_' + r,
            partyName: name,
            amount: goodsReturn,
            note: 'Goods Return'
        }});
    }}
    if (expiry > 0) {{
        expiryBreakdown.push({{
            id: 'ex_' + r,
            partyName: name,
            amount: expiry,
            note: 'Expiry Return'
        }});
    }}
}}

console.log(JSON.stringify({{
    success: true,
    month: '{from_month}',
    net_sales: Math.round(totalNetSales),
    net_sales_lacs: (totalNetSales / 100000).toFixed(2),
    sales_return: String(Math.round(totalReturn)),
    expiry: String(Math.round(totalExpiry)),
    sales_return_breakdown: returnBreakdown,
    expiry_breakdown: expiryBreakdown
}}));
"""
    proc = subprocess.run(["node", "-e", parse_script], capture_output=True, text=True)
    if proc.returncode == 0 and proc.stdout.strip():
        return json.loads(proc.stdout.strip())
    else:
        raise Exception("Failed to parse SPO Excel")
