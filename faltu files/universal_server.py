import os, sys, time, json, re, requests
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import existing engines safely without touching them
from dcr_calls_engine import start_task, start_recovery_task, get_task_state
from spo_engine import fetch_spo_data

app = FastAPI(title="DIOS Universal 1-Click Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")

class MonthRequest(BaseModel):
    from_month: str = "Aug-2026"
    to_month: str = "Aug-2026"
    fy_year: str = "2026-2027"

class ExtractionRequest(BaseModel):
    from_date: str = "01/04/2026"
    to_date: str = "30/04/2026"

class RecoveryRequest(BaseModel):
    taskId: str
    missed_dates: List[dict]

# 1. HEALTH CHECK (Tests if server is alive)
@app.get("/")
def health_check():
    cs_name = os.getenv("CODESPACE_NAME", "local")
    return {
        "status": "online",
        "engine": "Universal Smart Engine v1.0",
        "codespace": cs_name,
        "port": 8000
    }

# 2. CBO PRIMARY EXTRACTION (Live HTTP Session Scraper)
@app.post("/api/fetch-primary")
def api_fetch_primary(req: MonthRequest):
    month_map = {"JAN":"01","FEB":"02","MAR":"03","APR":"04","MAY":"05","JUN":"06","JUL":"07","AUG":"08","SEP":"09","OCT":"10","NOV":"11","DEC":"12"}
    m_code = req.from_month.split('-')[0].upper()[:3]
    m_num = month_map.get(m_code, "08")
    m_year = req.from_month.split('-')[1] if '-' in req.from_month else "2026"
    date_val = f"{m_num}/01/{m_year}"

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    try:
        # CBO Login
        login_url = "https://dios.myreporting.net/Login.aspx"
        r1 = session.get(login_url, timeout=20)
        vs = re.search(r'name="__VIEWSTATE"\s+value="([^"]*)"', r1.text)
        vsg = re.search(r'name="__VIEWSTATEGENERATOR"\s+value="([^"]*)"', r1.text)
        ev = re.search(r'name="__EVENTVALIDATION"\s+value="([^"]*)"', r1.text)

        payload = {
            "__VIEWSTATE": vs.group(1) if vs else "",
            "__VIEWSTATEGENERATOR": vsg.group(1) if vsg else "",
            "__EVENTVALIDATION": ev.group(1) if ev else "",
            "txtUserName": CBO_USER,
            "txtPassword": CBO_PASS,
            "btnLogin": "Login"
        }
        session.post(login_url, data=payload, timeout=20, allow_redirects=False)

        # Performance Review Report URL
        report_url = f"https://dios.myreporting.net/RPT/PerformanceReview.aspx?format=Primary%20Sales&wise=P&DOC_TYPE=SS&RPT_HEADER=Monthly%20Sales-Summary&CBOYN=Y&FY_YEAR={req.fy_year}&COMPANY_CODE=DIOS&PA_ID=6958&DESIG_ID=1&DESIG=BE&PA_NAME=BANWARI%20LAL%20MEENA&HEAD_QTR=UDAIPUR&DIVISION_NAME=DIOS%20GROUP&FMCGYN=N&MENU_STYLE=NONE&ACTION_FROM=ANDROID&LOGIN_PA_ID=6958&LOGIN_COMPANY_ID=1"
        session.get(report_url, timeout=20)

        # Query Grid
        grid_payload = {
            'LOGIN_PA_ID': '6958', 'GROUPON': 'null', 'WISE': 'null', 'FMONTH': date_val, 'TMONTH': date_val,
            'COLUMN': 'PRI_QTY,PRI_VAL', 'DATEYN': '0', 'GROUPFILTER': '0', 'WISEFILTER': '0', 'TARGET_ID': '0',
            'LRTYPE': 'V', 'SPL_ID': '0', 'STATE_ID': '0', 'HQ_ID': '0', 'ITEM_ID': '0', 'ITEMG_ID': '0',
            'ITEM_HR': '0', 'GROUP_COULUMN': '', 'STK_ID': '0', 'ITEM_STATUS': '1', 'QTRWISE_TOTALYN': '0',
            'HORIZONTALYN': '0', 'BILLYN': '0', 'ITEM_HR_ZERO': '0', 'STK_STATUS_P': '0', 'STK_STATUS_S': '0',
            'SALE_SHARE': 'H', 'iLYSALE_ON_CYTEAM': '1', 'sADD_COL': '', 'iPRI_PERIOD': '0', 'iROUDATA': '0',
            'iOUTST_PERIOD': '0', 'ITEMG_ID_2': '0', 'ITEMG_ID_3': '0', 'iOUTST_BALANCE': '0', 'COMPANY_ID': '0',
            'CRM_HQ_GROUP_ID': '0', 'ITEMG_ID_4': '0', 'PARTY_GROUP': '0'
        }
        ajax_headers = {"Content-Type": "application/json; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", "Referer": report_url}
        session.post("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETDATAGRID", json=grid_payload, headers=ajax_headers, timeout=20)

        r5 = session.post("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETGROUPEDBYDATAGRID_1", json={'GROUPCOLUMN': 'ITEM_NAME'}, headers=ajax_headers, timeout=20)
        raw_d = r5.json().get('d', '')

        items = []
        if raw_d:
            table_obj = json.loads(raw_d)
            rows = table_obj.get('Table', [])
            qty_key = f"Primary_Qty_{m_code}"
            val_key = f"Primary_Value_{m_code}"
            for row in rows:
                p_name = row.get('ITEM_NAME') or row.get('Product') or row.get('ITEM_DESC') or ''
                qty = row.get(qty_key) or row.get('Primary_Qty') or row.get('PRI_QTY') or 0
                val = row.get(val_key) or row.get('Primary_Value') or row.get('PRI_VAL') or 0
                if p_name and float(qty) > 0:
                    items.append({"name": p_name, "qty": float(qty), "value": float(val)})

        total_qty = sum(it["qty"] for it in items)
        total_val = sum(it["value"] for it in items)
        return {"success": True, "count": len(items), "total_qty": total_qty, "total_value": total_val, "items": items}
    except Exception as e:
        return {"success": False, "error": str(e), "items": []}

# 3. FW PROGRESS DCR EXCEL FETCHER (For Month FW Progress Sheet)
@app.post("/api/fetch-dcr-excel")
def api_fetch_dcr_excel(req: MonthRequest):
    # If DCR excel exists locally in repo, serve it directly
    local_xls = "DCR_August_2026_Live.xls"
    if os.path.exists(local_xls):
        with open(local_xls, "rb") as f:
            content = f.read()
        return Response(content=content, media_type="application/vnd.ms-excel", headers={"Content-Disposition": f"attachment; filename=DCR_{req.from_month}.xls"})
    return {"error": "DCR Excel source unavailable on server"}

# 4. DCR CALLS (Sheet 15 Live Crawl)
@app.post("/api/start-dcr-extraction")
def api_start_dcr(req: ExtractionRequest):
    return start_task(req.from_date, req.to_date)

@app.post("/api/retry-missed-dates")
def api_retry_missed(req: RecoveryRequest):
    return start_recovery_task(req.missed_dates, req.taskId)

@app.get("/api/extraction-status")
def api_get_status(taskId: str = Query("default")):
    return get_task_state(taskId)

# 5. SALES PERFORMANCE SPO
@app.post("/api/fetch-sales-performance")
def fetch_sales_performance(req: MonthRequest):
    try:
        return fetch_spo_data(req.from_month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
