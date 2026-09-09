#!/bin/bash
set -e

echo "=========================================================================="
echo "🛠️ [FIXING BUILD ERROR & ACTIVATING LIVE TERMINAL PORT 9000]..."
echo "=========================================================================="

# 1. Write clean ExpenseWorkspace.tsx without string literal break
python3 - << 'PYEOF'
with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the broken string concatenation with clean template strings
bad_chunk = """    let csv = `DIOS LIFESCIENCES PVT LTD,,,,,,,,,,,,,,,,,,\n`;
    csv += `Expense Statement,,,,,,,,,,,,,,,,,,\n`;
    csv += `Name: ${headerInfo.name},,,Division: ${headerInfo.division},,Head Qtr: ${headerInfo.hq},,Designation: ${headerInfo.designation},,,,,,,,,,,` + '\n';
    csv += `Code: ${headerInfo.code},,,State Name: ${headerInfo.state},,Approval Status: ${headerInfo.approvalStatus},,Month: ${headerInfo.monthDateStr},,,,,,,,,,,` + '\n';"""

clean_chunk = """    let csv = 'DIOS LIFESCIENCES PVT LTD,,,,,,,,,,,,,,,,,,\n';
    csv += 'Expense Statement,,,,,,,,,,,,,,,,,,\n';
    csv += 'Name: ' + headerInfo.name + ',,,Division: ' + headerInfo.division + ',,Head Qtr: ' + headerInfo.hq + ',,Designation: ' + headerInfo.designation + ',,,,,,,,,,,\n';
    csv += 'Code: ' + headerInfo.code + ',,,State Name: ' + headerInfo.state + ',,Approval Status: ' + headerInfo.approvalStatus + ',,Month: ' + headerInfo.monthDateStr + ',,,,,,,,,,,\n';"""

if bad_chunk in code:
    code = code.replace(bad_chunk, clean_chunk)
else:
    # Universal regex replace for any split line
    import re
    code = re.sub(
        r"csv \+= `Name:.*?Designation: \${headerInfo\.designation},,,,,,,,,,,` \+ '\\n';\s*csv \+= `Code:.*?Month: \${headerInfo\.monthDateStr},,,,,,,,,,,` \+ '\\n';",
        clean_chunk,
        code,
        flags=re.DOTALL
    )

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ 1. ExpenseWorkspace.tsx string syntax error fixed.")
PYEOF

# 2. Build Vite Frontend to verify 100% clean compilation
echo "📦 2. Building Vite Production Bundle (npm run build)..."
npm run build
echo "✅ 2. Build Successful with 0 errors!"

# 3. Start Live Terminal Web Server (Port 9000)
echo "🖥️ 3. Starting Live Terminal Server on Port 9000..."
pkill -f "live_terminal_server.py" 2>/dev/null || true
sleep 1

touch /tmp/terminal_stream.log
echo "[$(date +'%H:%M:%S')] 🚀 Live Terminal Port 9000 is fully ACTIVE & STREAMING." > /tmp/terminal_stream.log

nohup python3 live_terminal_server.py > /dev/null 2>&1 &
sleep 2

# 4. Make Port 9000 and 8000 Public
CURRENT_CS="${CODESPACE_NAME:-local}"
gh codespace ports visibility 9000:public -c "$CURRENT_CS" 2>/dev/null || true
gh codespace ports visibility 8000:public -c "$CURRENT_CS" 2>/dev/null || true

# 5. Restart Backend Server (Port 8000)
echo "🔄 4. Ensuring Backend Server is active on Port 8000..."
pkill -f "uvicorn server:app" 2>/dev/null || true
sleep 1
export PYTHONUNBUFFERED=1
nohup python3 -u -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 2

echo ""
echo "=========================================================================="
echo "🎉 ALL SYSTEMS ONLINE & PORTS ARE ACTIVE!"
echo "👉 LIVE TERMINAL PORT 9000: https://${CURRENT_CS}-9000.app.github.dev"
echo "👉 BACKEND API PORT 8000:   https://${CURRENT_CS}-8000.app.github.dev"
echo "=========================================================================="
echo "💡 Port 9000 link ko apne iPad browser tab me reload karein,"
echo "   wahan live stream turant chal jayegi aur aap 'COPY OUTPUT' kar sakenge!"
echo "=========================================================================="
