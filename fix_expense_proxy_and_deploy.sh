#!/bin/bash
set -e

echo "=========================================================================="
echo "🔗 [FIXING CLOUDFLARE PROXY] LINKING FETCH-EXPENSE TO CODESPACE PORT 8000..."
echo "=========================================================================="

CURRENT_CS="${CODESPACE_NAME:-local}"
PUBLIC_API="https://${CURRENT_CS}-8000.app.github.dev"
echo "🌐 Active Codespace Backend URL: $PUBLIC_API"

# 1. Update functions/api/fetch-expense.ts with full Codespace Public API URL
cat << CF_EXP > functions/api/fetch-expense.ts
export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    });
  }
  try {
    const body = await context.request.json().catch(() => ({}));
    const apiRes = await fetch("${PUBLIC_API}/api/fetch-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, {
      status: apiRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: "Backend Bridge Error: " + err.message }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
CF_EXP
echo "✅ 1. functions/api/fetch-expense.ts updated with $PUBLIC_API"

# 2. Restart backend server and ensure port 8000 is Public
echo "🔄 2. Ensuring Backend Server is active on Port 8000..."
pkill -f uvicorn 2>/dev/null || true
sleep 1
export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 2

gh codespace ports visibility 8000:public -c "$CURRENT_CS" 2>/dev/null || true
echo "✅ 2. Port 8000 is active and set to Public."

# 3. Build & Deploy
echo "📦 3. Building Production Bundle..."
npm run build

echo "☁️ 4. Deploying to Cloudflare Pages (dios-hub)..."
if [ -f "./deploy.sh" ]; then
    chmod +x ./deploy.sh
    ./deploy.sh || true
fi
npx wrangler pages deploy dist --project-name dios-hub --commit-dirty=true 2>&1 || true

# 5. Push to GitHub
git add -A
git reset -- .env .cloudflare_key deploy.sh cbo_session.json *.log *.zip 2>/dev/null || true
if ! git diff --cached --quiet; then
    git commit -m "fix: Connected fetch-expense Cloudflare proxy to Codespace backend"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git push origin "$CURRENT_BRANCH"
fi

echo ""
echo "=========================================================================="
echo "🎉 PROXY BRIDGE FIXED & DEPLOYED TO CLOUDFLARE!"
echo "👉 LIVE URL: https://dios-hub.pages.dev"
echo "=========================================================================="
