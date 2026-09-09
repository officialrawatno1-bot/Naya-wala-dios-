#!/bin/bash
set -e

echo "=========================================================================="
echo "📦 [1/2] COMPILING VITE PRODUCTION BUNDLE (npm run build)..."
echo "=========================================================================="
npm run build
echo "✅ Build Successful with 0 errors!"

echo ""
echo "=========================================================================="
echo "☁️ [2/2] DEPLOYING LIVE TO CLOUDFLARE PAGES (dios-hub)..."
echo "=========================================================================="
if [ -f "./deploy.sh" ]; then
    chmod +x ./deploy.sh
    ./deploy.sh
else
    npx wrangler pages deploy dist --project-name dios-hub --commit-dirty=true
fi

echo ""
echo "=========================================================================="
echo "🎉 ALL DONE! NAGDA 97-CHEMIST PARSER IS 100% LIVE ON CLOUDFLARE!"
echo "👉 LIVE URL: https://dios-hub.pages.dev"
echo "=========================================================================="
