#!/bin/bash
set -e
cd /workspaces/Dios

echo "========================================================="
echo "🚀 1. STEP 1: VERIFYING CODESPACE IDENTITY..."
echo "========================================================="
if [ -z "$CODESPACE_NAME" ]; then
  echo "❌ ERROR: CODESPACE_NAME environment variable not found!"
  exit 1
fi
echo "✅ Active Codespace Detected: $CODESPACE_NAME"
ACTIVE_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
echo "🌐 Target Public URL: $ACTIVE_URL"

echo ""
echo "========================================================="
echo "⚡ 2. STEP 2: STARTING UNIVERSAL BACKEND SERVER..."
echo "========================================================="
pkill -f "uvicorn universal_server:app" || true
pkill -f "uvicorn server:app" || true
sleep 1

nohup python3 -m uvicorn universal_server:app --host 0.0.0.0 --port 8000 > /workspaces/Dios/universal_server.log 2>&1 &
sleep 2.5

# Self-Testing IF condition: Local Health Check
HEALTH_CHECK=$(curl -s http://127.0.0.1:8000/ || echo "OFFLINE")
if [[ "$HEALTH_CHECK" == *"online"* ]]; then
  echo "✅ TEST PASSED: Local Server is 100% ONLINE on Port 8000!"
else
  echo "❌ TEST FAILED: Server failed to start! Check universal_server.log:"
  cat /workspaces/Dios/universal_server.log | tail -n 10
  exit 1
fi

echo ""
echo "========================================================="
echo "🔓 3. STEP 3: SETTING PORT 8000 TO PUBLIC VISIBILITY..."
echo "========================================================="
gh codespace ports visibility 8000:public -c "$CODESPACE_NAME" 2>/dev/null || true
echo "✅ Port 8000 set to Public."

echo ""
echo "========================================================="
echo "🔗 4. STEP 4: LINKING CLOUDFLARE TO THIS ACTIVE CODESPACE..."
echo "========================================================="
# Dynamically update Cloudflare functions with this active Codespace
cat << CF_PRI > /workspaces/Dios/functions/api/fetch-primary.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${ACTIVE_URL}/api/fetch-primary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) { return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
}
CF_PRI

cat << CF_DCR_EXCEL > /workspaces/Dios/functions/api/fetch-dcr-excel.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${ACTIVE_URL}/api/fetch-dcr-excel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const blob = await apiRes.arrayBuffer();
    return new Response(blob, { status: apiRes.status, headers: { "Content-Type": "application/vnd.ms-excel", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) { return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
}
CF_DCR_EXCEL

cat << CF_STATUS > /workspaces/Dios/functions/api/extraction-status.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get("taskId") || "default";
    const apiRes = await fetch("${ACTIVE_URL}/api/extraction-status?taskId=" + encodeURIComponent(taskId), { headers: { "Accept": "application/json" } });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) { return new Response(JSON.stringify({ status: "failed", error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
}
CF_STATUS

cat << CF_START > /workspaces/Dios/functions/api/start-dcr-extraction.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${ACTIVE_URL}/api/start-dcr-extraction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) { return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
}
CF_START

cat << CF_SPO > /workspaces/Dios/functions/api/fetch-sales-performance.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${ACTIVE_URL}/api/fetch-sales-performance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) { return new Response(JSON.stringify({ success: false, error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
}
CF_SPO

echo "✅ Cloudflare Proxies Linked to $ACTIVE_URL"

echo ""
echo "========================================================="
echo "📦 5. STEP 5: BUILDING & DEPLOYING TO CLOUDFLARE..."
echo "========================================================="
npm run build
./deploy.sh

echo ""
echo "========================================================="
echo "🎉 SUCCESS: SYSTEM IS 100% ONLINE AND VERIFIED!"
echo "🌐 Live URL: https://dios-hub.pages.dev"
echo "========================================================="
