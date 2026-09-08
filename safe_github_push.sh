#!/bin/bash
set -e

echo "=========================================================================="
echo "🛡️ [SAFE GITHUB BACKUP] SECURING KEYS & PUSHING ALL CODE TO GITHUB..."
echo "=========================================================================="

# 1. Update .gitignore to strictly exclude all keys and sensitive credentials
cat << 'GIGNO' > .gitignore
node_modules/
dist/
.env
.env.*
.cloudflare_key
*.key
*.pem
deploy.sh
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

echo "✅ 1. .gitignore configured to block all global keys and secret files."

# 2. Untrack sensitive files if accidentally tracked before
git rm --cached .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json 2>/dev/null || true

# 3. Stage all updated project files
git add -A

# 4. Explicit safety check: Unstage any secret files
git reset -- .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json *.log *.zip 2>/dev/null || true

echo "✅ 2. All project files, components, and engines staged."

# 5. Commit and Push
if git diff --cached --quiet; then
    echo "ℹ️ No changes to commit. Working tree is already up to date."
else
    TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
    git commit -m "backup: Full project save with all components and engines ($TIMESTAMP)"
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "🌐 3. Pushing to GitHub (Branch: $CURRENT_BRANCH)..."
    git push origin "$CURRENT_BRANCH"
    echo "🎉 4. Pushed to GitHub Successfully!"
fi

echo ""
echo "=========================================================================="
echo "📊 GIT REPO STATUS (Clean & Protected):"
echo "=========================================================================="
git status -s
echo "=========================================================================="
