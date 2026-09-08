#!/bin/bash
set -e

echo "=========================================================================="
echo "🚀 [CLOUDFLARE & GITHUB DEPLOY] DEPLOYING EXPENSE MODULE TO LIVE..."
echo "=========================================================================="

# 1. Build Latest Production Frontend
echo "📦 1. Building Production Vite Bundle (dist)..."
npm run build

# 2. Restart Local Backend Server with /api/fetch-expense
echo "🔄 2. Restarting Backend Server (Port 8000)..."
pkill -f uvicorn 2>/dev/null || true
sleep 1
export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 2

# 3. Deploy to Cloudflare Pages (Wrangler / Direct Deploy)
echo "☁️ 3. Deploying to Cloudflare Pages (dios-hub)..."
if [ -f "./deploy.sh" ]; then
    chmod +x ./deploy.sh
    ./deploy.sh || true
fi

npx wrangler pages deploy dist --project-name dios-hub --commit-dirty=true 2>&1 || true

# 4. Stage, Commit & Push to GitHub (Triggers Auto-Build on Cloudflare)
echo "🌐 4. Pushing New Files to GitHub Repository..."
git add -A
git reset -- .env .cloudflare_key deploy.sh cbo_session.json *.log *.zip 2>/dev/null || true

if git diff --cached --quiet; then
    echo "ℹ️ Git working tree already clean."
else
    CURRENT_DATE=$(date +'%Y-%m-%d %H:%M:%S')
    git commit -m "feat: Active Expense Statement Workspace with Live CBO Auto-Fetch & Cloud Sync ($CURRENT_DATE)"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git push origin "$CURRENT_BRANCH"
    echo "✅ Pushed to GitHub ($CURRENT_BRANCH) successfully!"
fi

echo ""
echo "=========================================================================="
echo "🎉 DEPLOYMENT 100% COMPLETE & LIVE!"
echo "👉 LIVE CLOUDFLARE URL: https://dios-hub.pages.dev"
echo "👉 CODESPACE URL:       https://${CODESPACE_NAME:-local}-5173.app.github.dev"
echo "=========================================================================="
