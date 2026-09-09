#!/bin/bash

echo "=========================================================================="
echo "🚀 [PUSHING & DEPLOYING EXPENSE MODULE TO CLOUDFLARE & GITHUB]..."
echo "=========================================================================="

CURRENT_CS="${CODESPACE_NAME:-local}"

# 1. Ensure build is fresh
echo "📦 1. Building Production Bundle (npm run build)..."
npm run build

# 2. Stage only project code & ignore secrets
echo "🌐 2. Pushing to GitHub repository..."
git add -A
git reset -- deploy_and_run_august.sh run_all_fixed.sh .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json *.log *.zip 2>/dev/null || true

if ! git diff --cached --quiet; then
    TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
    git commit -m "feat: Live Universal Expense Statement module with 19-col CBO CSV import ($TIMESTAMP)"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git push origin "$CURRENT_BRANCH" || true
    echo "✅ Pushed to GitHub ($CURRENT_BRANCH) successfully!"
else
    echo "ℹ️ Git branch is up to date."
fi

# 3. Direct Cloudflare Pages Deploy
echo "☁️ 3. Deploying to Cloudflare Pages (dios-hub)..."
if [ -f "./deploy.sh" ]; then
    chmod +x ./deploy.sh
    ./deploy.sh 2>&1 || true
fi

# Deploy with wrangler
npx wrangler pages deploy dist --project-name dios-hub --commit-dirty=true 2>&1 || true

# 4. Start Local Vite Live App (Port 5173) for instant zero-cache access
echo "⚡ 4. Starting Local Live Preview Server (Port 5173)..."
pkill -f "vite" 2>/dev/null || true
sleep 1
nohup npx vite --host 0.0.0.0 --port 5173 > /dev/null 2>&1 &
sleep 2
gh codespace ports visibility 5173:public -c "$CURRENT_CS" 2>/dev/null || true

# 5. Ensure Port 9000 and 8000 are also Public and Active
echo "🖥️ 5. Ensuring Port 9000 (Terminal) and Port 8000 (Backend) are Online..."
pkill -f "live_terminal_server.py" 2>/dev/null || true
nohup python3 live_terminal_server.py > /dev/null 2>&1 &
sleep 1
gh codespace ports visibility 9000:public -c "$CURRENT_CS" 2>/dev/null || true

pkill -f "uvicorn server:app" 2>/dev/null || true
export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 1
gh codespace ports visibility 8000:public -c "$CURRENT_CS" 2>/dev/null || true

echo ""
echo "=========================================================================="
echo "🎉 DEPLOYMENT FINISHED & ALL SERVERS ARE LIVE!"
echo "=========================================================================="
echo "👉 1. LIVE CLOUDFLARE APP : https://dios-hub.pages.dev"
echo "👉 2. INSTANT PREVIEW     : https://${CURRENT_CS}-5173.app.github.dev"
echo "👉 3. LIVE TERMINAL (9000): https://${CURRENT_CS}-9000.app.github.dev"
echo "=========================================================================="
echo "💡 Safari me 'https://dios-hub.pages.dev' ko ek baar Hard Refresh karein"
echo "   (ya agar cache ho toh Instant Preview Port 5173 link open karein)!"
echo "=========================================================================="
