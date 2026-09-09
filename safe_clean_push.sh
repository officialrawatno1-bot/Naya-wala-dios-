#!/bin/bash
set -e

echo "=========================================================================="
echo "🛡️ [1/4] RESETTING UNPUSHED COMMIT TO CLEAR SECRET FROM GIT HISTORY..."
echo "=========================================================================="

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# 1. Reset commits ahead of origin without losing ANY local code
git reset origin/"$CURRENT_BRANCH" 2>/dev/null || git reset HEAD~1

# 2. Strict .gitignore setup for all secret & deployment key scripts
cat << 'GIGNO' > .gitignore
node_modules/
dist/
.env
.env.*
.cloudflare_key
*.key
*.pem
deploy.sh
deploy_to_cloudflare_now.sh
deploy_and_run_august.sh
run_all_fixed.sh
cbo_session.json
cbo_device.json
complete_project_code.txt
src_code.txt
*.log
*.zip
.wrangler/
__pycache__/
*.pyc
GIGNO

echo "✅ 1. .gitignore updated & secret scripts blocked."

# 3. Untrack any key-containing files if they were tracked
git rm --cached deploy_to_cloudflare_now.sh deploy.sh cbo_device.json cbo_session.json 2>/dev/null || true

# 4. Stage ONLY clean project source code & components
git add .gitignore
git add src/
git add functions/
git add public/
git add package.json
git add vite.config.ts
git add wrangler.toml
git add tsconfig.json 2>/dev/null || true
git add index.html
git add requirements.txt
git add Dockerfile
git add *.py *.sh 2>/dev/null || true

# 5. Explicitly unstage any key/token files
git reset -- deploy_to_cloudflare_now.sh deploy.sh cbo_device.json cbo_session.json .env .cloudflare_key *.log *.zip 2>/dev/null || true

echo "=========================================================================="
echo "📦 [2/4] COMMITTING CLEAN REPO (ZERO SECRETS)..."
echo "=========================================================================="

TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
git commit -m "feat: Partywise Dual Parser, CSV Exporter & Cloudflare KV Updates ($TIMESTAMP)"

echo "=========================================================================="
echo "🌐 [3/4] PUSHING TO GITHUB (Branch: $CURRENT_BRANCH)..."
echo "=========================================================================="

git push origin "$CURRENT_BRANCH"

echo ""
echo "=========================================================================="
echo "🎉 [4/4] SUCCESS: GITHUB REPO IS 100% UPDATED & PROTECTED!"
echo "=========================================================================="
git status -s
echo "=========================================================================="
