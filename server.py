import os, sys, time, subprocess, json, requests
from collections import deque
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

SERVER_LOG_FILE = "/workspaces/Naya-wala-dios-/server.log"

if not os.path.exists(SERVER_LOG_FILE):
    with open(SERVER_LOG_FILE, "w") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] DIOS Persistent Terminal Initialized.\n")

def get_persisted_logs():
    if os.path.exists(SERVER_LOG_FILE):
        try:
            with open(SERVER_LOG_FILE, "r", encoding="utf-8", errors="ignore") as f:
                return [l.rstrip("\r\n") for l in f.readlines() if l.strip()]
        except Exception:
            pass
    return [f"[{time.strftime('%H:%M:%S')}] Terminal ready."]

from dcr_calls_engine import start_task, start_recovery_task, get_task_state
from spo_engine import fetch_spo_data
from primary_playwright_engine import fetch_primary_via_playwright
from primary_excel_generator import build_cbo_primary_excel_blob, get_primary_cache
from dcr_live_engine import fetch_live_dcr_excel
from expense_engine import fetch_cbo_expense

app = FastAPI(title="DIOS Persistent Terminal Engine")

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

@app.post("/api/fetch-primary")
def api_fetch_primary(req: MonthRequest):
    return fetch_primary_via_playwright(req.from_month, req.to_month, req.fy_year)

@app.post("/api/fetch-cbo-excel")
def api_fetch_cbo_excel(req: MonthRequest):
    cached_items = get_primary_cache(req.from_month)
    if not cached_items:
        primary_res = fetch_primary_via_playwright(req.from_month, req.to_month, req.fy_year)
        cached_items = primary_res.get("items", [])
    excel_bytes = build_cbo_primary_excel_blob(cached_items, req.from_month)
    return Response(content=excel_bytes, media_type="application/vnd.ms-excel", headers={"Content-Disposition": f"attachment; filename=CBO_Primary_{req.from_month}.xls"})

@app.post("/api/fetch-dcr-excel")
def api_fetch_dcr_excel(req: MonthRequest):
    excel_bytes = fetch_live_dcr_excel(req.from_month)
    if excel_bytes:
        return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename=DCR_{req.from_month}.xlsx"})
    raise HTTPException(status_code=500, detail="Failed to fetch live DCR from CBO")

@app.post("/api/fetch-sales-performance")
def fetch_sales_performance(req: MonthRequest):
    return fetch_spo_data(req.from_month)

@app.post("/api/start-dcr-extraction")
def api_start_dcr(req: ExtractionRequest):
    return start_task(req.from_date, req.to_date)

@app.post("/api/retry-missed-dates")
def api_retry_missed(req: RecoveryRequest):
    return start_recovery_task(req.missed_dates, req.taskId)

@app.get("/api/extraction-status")
def api_get_status(taskId: str = Query("default")):
    return get_task_state(taskId)

# 🌟 SMART AUTO-SCROLL HTML PAGE (Does not jump if user scrolls up!)
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DIOS Live Terminal Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex flex-col h-screen p-4 font-mono">
  <div class="flex items-center justify-between pb-3 border-b border-slate-800">
    <h1 class="text-base font-bold text-white flex items-center gap-2">
      ⚡ DIOS Live Terminal 
      <span id="connDot" class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span id="connText" class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">● LIVE PERSISTENT (0.8s)</span>
    </h1>
    <div class="flex gap-2">
      <button onclick="copyOutput()" id="copyBtn" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition">📋 COPY OUTPUT</button>
      <button onclick="fetchLogs()" id="refreshBtn" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
        <svg id="refreshIcon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        Refresh
      </button>
    </div>
  </div>
  <div id="consoleBox" class="flex-1 bg-black rounded-2xl border-2 border-slate-800 p-4 text-xs overflow-y-auto mt-3 space-y-1 select-text">
    <div class="text-slate-500 text-center py-20">Connecting to persistent stream...</div>
  </div>
  <script>
    let lastLineCount = 0;

    async function fetchLogs() {
      const icon = document.getElementById('refreshIcon');
      if (icon) icon.classList.add('animate-spin');

      try {
        const res = await fetch('/api/terminal-logs?tail=800');
        const data = await res.json();
        const lines = data.lines || [];
        const box = document.getElementById('consoleBox');
        
        box.innerHTML = lines.map((l, i) => {
          let cls = 'text-slate-300';
          const up = l.toUpperCase();
          if (up.includes('ERROR') || up.includes('FAIL') || up.includes('❌')) cls = 'text-rose-400 font-bold';
          else if (up.includes('SUCCESS') || up.includes('✅') || up.includes('PASS')) cls = 'text-emerald-300 font-semibold';
          else if (up.includes('⚡') || up.includes('🚀') || up.includes('🔬')) cls = 'text-cyan-300 font-bold';
          return `<div class="py-0.5 break-all ${cls}"><span class="text-slate-600 mr-2 text-[10px]">${String(i+1).padStart(3, '0')}</span>${l}</div>`;
        }).join('');

        // 🌟 Smart Auto-Scroll: Only scroll down if user is already near bottom, or new lines arrived and user hasn't scrolled up
        const isAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
        if (isAtBottom || lines.length > lastLineCount) {
          box.scrollTop = box.scrollHeight;
        }
        lastLineCount = lines.length;

        document.getElementById('connDot').className = 'inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
        document.getElementById('connText').innerText = '● LIVE PERSISTENT (0.8s)';
      } catch(e) {
        document.getElementById('connDot').className = 'inline-block w-2.5 h-2.5 rounded-full bg-rose-500';
        document.getElementById('connText').innerText = '❌ DISCONNECTED';
      }

      if (icon) setTimeout(() => icon.classList.remove('animate-spin'), 500);
    }

    function copyOutput() {
      const text = Array.from(document.querySelectorAll('#consoleBox div')).map(d => d.innerText).join('\\n');
      navigator.clipboard.writeText(text);
      document.getElementById('copyBtn').innerText = '✅ COPIED!';
      setTimeout(() => document.getElementById('copyBtn').innerText = '📋 COPY OUTPUT', 2000);
    }

    fetchLogs(); 
    setInterval(fetchLogs, 800);
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
    lines = get_persisted_logs()[-tail:]
    return {"status": "online", "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "total_lines": len(lines), "lines": lines}

@app.post("/api/clear-terminal-logs")
def clear_terminal_logs():
    if os.path.exists(SERVER_LOG_FILE):
        with open(SERVER_LOG_FILE, "w") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] 🧹 Terminal log cleared.\n")
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

@app.post("/api/fetch-expense")
def api_fetch_expense(req: MonthRequest):
    return fetch_cbo_expense(req.from_month)
