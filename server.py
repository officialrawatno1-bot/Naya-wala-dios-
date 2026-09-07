import os, sys, time, json, requests
from collections import deque
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

STREAM_FILE = "/tmp/terminal_stream.log"

def log_stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(STREAM_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass

def get_latest_stream():
    if os.path.exists(STREAM_FILE):
        try:
            with open(STREAM_FILE, "r", encoding="utf-8", errors="ignore") as f:
                return [l.rstrip("\r\n") for l in f.readlines() if l.strip()]
        except Exception:
            pass
    return []

from dcr_calls_engine import start_task, start_recovery_task, get_task_state
from spo_engine import fetch_spo_data
from primary_playwright_engine import fetch_primary_via_playwright
from primary_excel_generator import build_cbo_primary_excel_blob, get_primary_cache
from dcr_live_engine import fetch_live_dcr_excel

app = FastAPI(title="DIOS Master Live Production Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# 🌟 1. CBO PRIMARY DATA API (1-Click Auto-Fill)
@app.post("/api/fetch-primary")
def api_fetch_primary(req: MonthRequest):
    log_stream(f"⚡ [Primary Fetch] Request for {req.from_month}...")
    return fetch_primary_via_playwright(req.from_month, req.to_month, req.fy_year)

# 🌟 2. CBO PRIMARY EXCEL API
@app.post("/api/fetch-cbo-excel")
def api_fetch_cbo_excel(req: MonthRequest):
    cached_items = get_primary_cache(req.from_month)
    if not cached_items:
        primary_res = fetch_primary_via_playwright(req.from_month, req.to_month, req.fy_year)
        cached_items = primary_res.get("items", [])
    
    excel_bytes = build_cbo_primary_excel_blob(cached_items, req.from_month)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename=CBO_Primary_{req.from_month}.xls"}
    )

# 🌟 3. 100% REAL LIVE DCR EXCEL API (Month FW Progress - Sheet 2!)
@app.post("/api/fetch-dcr-excel")
def api_fetch_dcr_excel(req: MonthRequest):
    log_stream(f"⚡ [DCR Live Fetch] Request for {req.from_month}...")
    excel_bytes = fetch_live_dcr_excel(req.from_month)
    if excel_bytes:
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=DCR_{req.from_month}.xlsx"}
        )
    raise HTTPException(status_code=500, detail="Failed to fetch live DCR from CBO")

# 🌟 4. SPO SALES PERFORMANCE API
@app.post("/api/fetch-sales-performance")
def fetch_sales_performance(req: MonthRequest):
    return fetch_spo_data(req.from_month)

# 🌟 5. DCR CALLS EXTRACTION APIS
@app.post("/api/start-dcr-extraction")
def api_start_dcr(req: ExtractionRequest):
    return start_task(req.from_date, req.to_date)

@app.post("/api/retry-missed-dates")
def api_retry_missed(req: RecoveryRequest):
    return start_recovery_task(req.missed_dates, req.taskId)

@app.get("/api/extraction-status")
def api_get_status(taskId: str = Query("default")):
    return get_task_state(taskId)

# Live Terminal Viewer
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>DIOS Live Terminal</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-950 text-slate-100 flex flex-col h-screen p-4 font-mono">
  <div class="flex items-center justify-between pb-3 border-b border-slate-800">
    <h1 class="text-base font-bold text-white flex items-center gap-2">⚡ DIOS Master Engine Terminal <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">● ONLINE</span></h1>
    <button onclick="copyOutput()" id="copyBtn" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow">📋 COPY LATEST OUTPUT</button>
  </div>
  <div id="consoleBox" class="flex-1 bg-black rounded-2xl border border-slate-800 p-4 text-xs overflow-y-auto mt-3 space-y-1"></div>
  <script>
    async function fetchLogs() {
      try {
        const res = await fetch('/api/terminal-logs?tail=500');
        const data = await res.json();
        const box = document.getElementById('consoleBox');
        box.innerHTML = data.lines.map((l, i) => `<div class="py-0.5 text-slate-300"><span class="text-slate-600 mr-2">${i+1}</span>${l}</div>`).join('');
        box.scrollTop = box.scrollHeight;
      } catch(e) {}
    }
    function copyOutput() {
      const text = Array.from(document.querySelectorAll('#consoleBox div')).map(d => d.innerText).join('\\n');
      navigator.clipboard.writeText(text);
      document.getElementById('copyBtn').innerText = '✅ COPIED!';
      setTimeout(() => document.getElementById('copyBtn').innerText = '📋 COPY LATEST OUTPUT', 2000);
    }
    fetchLogs(); setInterval(fetchLogs, 800);
  </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
@app.get("/terminal", response_class=HTMLResponse)
def root_terminal():
    return HTML_PAGE

@app.get("/api/terminal-logs")
def get_terminal_logs(tail: int = 500):
    lines = get_latest_stream()[-tail:]
    return {"status": "online", "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "total_lines": len(lines), "lines": lines}

@app.post("/api/clear-terminal-logs")
def clear_terminal_logs():
    with open(STREAM_FILE, "w") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] 🧹 Terminal stream cleared.\n")
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
