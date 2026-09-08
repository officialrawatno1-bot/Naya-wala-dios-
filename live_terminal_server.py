import os, sys, time, re
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

LOG_FILE = "/tmp/terminal_stream.log"

app = FastAPI(title="DIOS Codespace Live Web Terminal")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def clean_ansi(text: str) -> str:
    ansi_regex = r'(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]'
    return re.sub(ansi_regex, '', text).replace('\r', '')

HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIOS Live Terminal (Port 9000)</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex flex-col h-screen p-3 md:p-5 font-mono">
  
  <!-- Header -->
  <div class="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
    <div class="flex items-center gap-2.5">
      <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
      <div>
        <h1 class="text-xs md:text-sm font-bold text-white flex items-center gap-2">
          ⚡ DIOS CODESPACE LIVE TERMINAL
          <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            PORT 9000
          </span>
        </h1>
        <p class="text-[10px] text-slate-400">Live Streaming CBO Extractor & System Outputs</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="copyOutput()" id="copyBtn" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95">
        📋 COPY OUTPUT
      </button>
      <button onclick="clearLogs()" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer">
        🧹 CLEAR
      </button>
    </div>
  </div>

  <!-- Terminal Console Box -->
  <div id="outputBox" class="flex-1 bg-black rounded-2xl border-2 border-slate-800 p-4 text-xs overflow-y-auto mt-3 whitespace-pre-wrap select-text leading-relaxed text-slate-200">
    Connecting to Codespace live stream...
  </div>

  <script>
    let isScrolledUp = false;
    const box = document.getElementById('outputBox');

    box.addEventListener('scroll', () => {
      isScrolledUp = (box.scrollHeight - box.scrollTop - box.clientHeight) > 60;
    });

    async function fetchStream() {
      try {
        const res = await fetch('/api/stream?t=' + Date.now());
        const data = await res.json();
        if (data.content) {
          box.textContent = data.content;
          if (!isScrolledUp) {
            box.scrollTop = box.scrollHeight;
          }
        }
      } catch (e) {}
    }

    function copyOutput() {
      const text = box.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerText = '✅ COPIED TO IPAD!';
        setTimeout(() => btn.innerText = '📋 COPY OUTPUT', 2000);
      });
    }

    async function clearLogs() {
      await fetch('/api/clear', { method: 'POST' });
      fetchStream();
    }

    setInterval(fetchStream, 500);
    fetchStream();
  </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def root():
    return HTML_PAGE

@app.get("/api/stream")
def get_stream():
    if not os.path.exists(LOG_FILE):
        return {"content": "Waiting for terminal output..."}
    try:
        with open(LOG_FILE, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            cleaned = clean_ansi("".join(lines[-500:]))
            return {"content": cleaned}
    except Exception as e:
        return {"content": str(e)}

@app.post("/api/clear")
def clear_stream():
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] Terminal stream cleared.\n")
    except: pass
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)
