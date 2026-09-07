#!/bin/bash
set -e

echo "=========================================================================="
echo "🚀 [DIOS MASTER UNIVERSAL SETUP] INITIALIZING COMPLETE ENVIRONMENT..."
echo "=========================================================================="

cd /workspaces/Naya-wala-dios- 2>/dev/null || cd /workspaces/* 2>/dev/null || true

# 1. Linux & Chromium
echo ""
echo "📦 [1/5] Installing Linux Dependencies & Chromium Engine..."
sudo apt-get update -qq >/dev/null 2>&1 || true
sudo playwright install-deps chromium 2>/dev/null || playwright install-deps chromium 2>/dev/null || true
playwright install chromium >/dev/null 2>&1 || true
echo "   ✅ Browser Engine Ready."

# 2. Dependencies
echo ""
echo "📦 [2/5] Installing Node & Python Dependencies..."
pip install -q -r requirements.txt >/dev/null 2>&1 || pip install fastapi uvicorn playwright openpyxl requests beautifulsoup4 pydantic >/dev/null 2>&1
npm install --silent >/dev/null 2>&1 || true
echo "   ✅ Dependencies Installed."

# 3. Dynamic Codespace URL & Proxies
echo ""
echo "🌐 [3/5] Syncing Cloudflare Proxy Endpoints to this Codespace..."
CURRENT_CS="${CODESPACE_NAME:-super-duper-space-adventure}"
PUBLIC_API="https://${CURRENT_CS}-8000.app.github.dev"
echo "   Active Backend URL: $PUBLIC_API"

mkdir -p functions/api

cat << CFEOF > functions/api/fetch-primary.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/fetch-primary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/fetch-cbo-excel.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/fetch-cbo-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const blob = await apiRes.arrayBuffer();
    return new Response(blob, { status: apiRes.status, headers: { "Content-Type": "application/vnd.ms-excel", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/fetch-dcr-excel.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/fetch-dcr-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const blob = await apiRes.arrayBuffer();
    return new Response(blob, { status: apiRes.status, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/fetch-sales-performance.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/fetch-sales-performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/start-dcr-extraction.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/start-dcr-extraction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/extraction-status.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get("taskId") || "default";
    const apiRes = await fetch("${PUBLIC_API}/api/extraction-status?taskId=" + encodeURIComponent(taskId), { headers: { "Accept": "application/json" } });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ status: "failed", error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

cat << CFEOF > functions/api/retry-missed-dates.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/retry-missed-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
CFEOF

echo "   ✅ Cloudflare API Proxies Synced."

# 4. Start Servers
echo ""
echo "🔄 [4/5] Starting Background Servers..."
pkill -f uvicorn 2>/dev/null || true
pkill -f vite 2>/dev/null || true
sleep 1

export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 2

nohup npx vite --host 0.0.0.0 --port 5173 > vite.log 2>&1 &
sleep 2

gh codespace ports visibility 8000:public -c $CODESPACE_NAME 2>/dev/null || true
gh codespace ports visibility 5173:public -c $CODESPACE_NAME 2>/dev/null || true

# 5. Build Frontend
echo ""
echo "☁️ [5/5] Building Frontend..."
npm run build >/dev/null 2>&1

echo ""
echo "=========================================================================="
echo "🎉 UNIVERSAL SETUP COMPLETED SUCCESSFULLY!"
echo "=========================================================================="
echo "👉 LOCAL CODESPACE APP:  https://${CURRENT_CS}-5173.app.github.dev"
echo "=========================================================================="
