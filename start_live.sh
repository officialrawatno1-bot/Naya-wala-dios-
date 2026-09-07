#!/bin/bash
set -e
cd /workspaces/Naya-wala-dios-

echo "=========================================================================="
echo "🚀 STARTING DIOS LIVE SYSTEM (PORT 8000 + PORT 5173)..."
echo "=========================================================================="

pkill -f uvicorn 2>/dev/null || true
pkill -f vite 2>/dev/null || true
sleep 1

# Install required dependencies just in case
playwright install chromium >/dev/null 2>&1 || true
pip install -q -r requirements.txt >/dev/null 2>&1 || true
npm install --silent >/dev/null 2>&1 || true

export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 2

nohup npx vite --host 0.0.0.0 --port 5173 > vite.log 2>&1 &
sleep 2

gh codespace ports visibility 8000:public -c $CODESPACE_NAME 2>/dev/null || true
gh codespace ports visibility 5173:public -c $CODESPACE_NAME 2>/dev/null || true

echo "=========================================================================="
echo "🎉 ALL SERVERS STARTED SUCCESSFULLY!"
echo "👉 Frontend App:    https://${CODESPACE_NAME}-5173.app.github.dev"
echo "👉 Live Terminal:   https://${CODESPACE_NAME}-8000.app.github.dev"
echo "=========================================================================="
