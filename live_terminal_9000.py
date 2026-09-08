import os, sys, time, re
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

LOG_FILE = "/tmp/codespace_terminal.log"

if not os.path.exists(LOG_FILE):
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Codespace Bash Terminal Session Started...\n")

app = FastAPI(title="Codespace Bash Live Streamer")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def clean_ansi(text: str) -> str:
    ansi_regex = r'(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]'
    return re.sub(ansi_regex, '', text).replace('\r', '')

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codespace Live Terminal Output</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex flex-col h-screen p-3 md:p-5 font-mono">
  <div class="flex items-center justify-between pb-3 border-b border-slate-800">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
      <h1 class="text-xs md:text-sm font-bold text-white">
        🖥️ CODESPACE BASH TERMINAL (LIVE OUTPUT)
      </h1>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="copyOutput()" id="copyBtn" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition cursor-pointer">📋 COPY OUTPUT</button>
      <button onclick="clearScreen()" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer">🧹 CLEAR</button>
    </div>
  </div>

  <div id="outputBox" class="flex-1 bg-black rounded-2xl border border-slate-800 p-4 text-xs overflow-y-auto mt-3 space-y-0.5 whitespace-pre-wrap select-text leading-relaxed">
    Connecting to Codespace terminal stream...
  </div>

  <script>
    let isUserScrolledUp = false;
    const box = document.getElementById('outputBox');

    box.addEventListener('scroll', () => {
      isUserScrolledUp = (box.scrollHeight - box.scrollTop - box.clientHeight) > 80;
    });

    async function fetchStream() {
      try {
        const res = await fetch('/api/live-stream');
        const data = await res.json();
        box.textContent = data.content || '(Terminal is idle. Type commands in Codespace)';
        if (!isUserScrolledUp) {
          box.scrollTop = box.scrollHeight;
        }
      } catch (e) {}
    }

    function copyOutput() {
      const text = box.textContent;
      navigator.clipboard.writeText(text);
      const btn = document.getElementById('copyBtn');
      btn.innerText = '✅ COPIED TO IPAD!';
      setTimeout(() => btn.innerText = '📋 COPY OUTPUT', 2000);
    }

    async function clearScreen() {
      await fetch('/api/clear-stream', { method: 'POST' });
      fetchStream();
    }

    setInterval(fetchStream, 600);
    fetchStream();
  </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def index():
    return HTML_TEMPLATE

@app.get("/api/live-stream")
def get_stream():
    if not os.path.exists(LOG_FILE):
        return {"content": "No terminal activity recorded yet."}
    try:
        with open(LOG_FILE, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            last_lines = lines[-400:]
            cleaned = clean_ansi("".join(last_lines))
            return {"content": cleaned}
    except Exception as e:
        return {"content": str(e)}

@app.post("/api/clear-stream")
def clear_stream():
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] Terminal stream cleared.\n")
    except: pass
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)
