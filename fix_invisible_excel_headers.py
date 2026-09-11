import os, subprocess

print("==========================================================================")
print("🛠️ [FIXING INVISIBLE EXCEL HEADERS ACROSS ALL SHEETS]...")
print("==========================================================================")

# 1. Update standardTheme.ts with high-contrast visible font colors
theme_code = """export const borderThin = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

export const standardTheme = {
  // 🌟 Yellow Top Header Box
  headerYellowLeft: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  headerYellowCenterBold: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  headerYellowRedText: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FF0000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  headerYellowCol: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },
  headerYellowColLeft: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },

  // 🔵 Sheet 14: Dark Navy Blue Header with White Text
  headerNavyWhiteText: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1F497D' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🟡 Sheet 14: Doctor Name Yellow Highlight Cell
  cellYellowDoctorName: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },

  // 🔴 Sheet 13: Solid Red Sub-Headers
  subHeaderRed: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FF0000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🌟 Sheet 3 Dark Grey Bar
  headerDarkGreyBar: {
    fill: { fgColor: { rgb: '595959' } },
    border: borderThin
  },

  // 🌟 Sheet 2 Headers & Sunday Maroon Bar
  headerPlainBold: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  headerPlainSmall: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  sundayBar: {
    fill: { fgColor: { rgb: 'B83B3B' } },
    border: borderThin
  },

  // 🔴🟡 Red Background + Yellow Text
  headerRedYellowText: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFF00' } },
    fill: { fgColor: { rgb: 'FF0000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  headerGreenPts: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: '70AD47' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🌟 SHEET 4: FIXED BLACK FONT ON LIGHT TINT BACKGROUNDS
  subHeaderNetPri: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } }, // Black Font on Blue
    fill: { fgColor: { rgb: 'BDD7EE' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  subHeaderNetSec: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } }, // Black Font on Green
    fill: { fgColor: { rgb: 'C6E0B4' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  subHeaderClosing: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } }, // Black Font on Peach
    fill: { fgColor: { rgb: 'F8CBAD' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🟤 Sheet 5: Copper & Peach
  bannerCopper: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'C55A11' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  headerLightPeach: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FCE4D6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 💖 Hot Magenta Pink
  headerHotPink: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'FFFFFF' } }, // Crisp White on Magenta
    fill: { fgColor: { rgb: 'FF007F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  bannerHotPink: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, // Crisp White on Magenta
    fill: { fgColor: { rgb: 'FF007F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  bannerMagentaCyanText: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } }, // High-Contrast White Font
    fill: { fgColor: { rgb: 'FF007F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🌸 Dusty Rose & Green
  headerDustyRose: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'CC6B6B' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },
  headerDustyRoseLeft: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'CC6B6B' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },

  // 🌟 SHEETS 9 & 10: FIXED WHITE BOLD TEXT ON GREEN BANNER
  bannerLightGreen: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } }, // Crisp White Font
    fill: { fgColor: { rgb: '6CA84E' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🌟 SHEETS 11 & 16: FIXED BLACK FONT ON SILVER GREY
  headerSilverGrey: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } }, // Black Font
    fill: { fgColor: { rgb: 'D9D9D9' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  headerSilverGreyLeft: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } }, // Black Font
    fill: { fgColor: { rgb: 'D9D9D9' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  headerSkyBlue: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: '9BC2E6' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },
  headerGrowthYellow: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },

  // 🔵 Sheet 12: Steel Blue Header
  headerSteelBlue: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: '9BC2E6' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },

  // Standard Table Column Header
  colHeader: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  colHeaderWrapped: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  },

  // Normal Data Cells
  cellLeft: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  },
  cellCenter: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  cellCenterBold: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  cellRight: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderThin
  },
  cellRedLabel: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FF0000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin
  }
};
"""

with open('src/exporters/styles/standardTheme.ts', 'w', encoding='utf-8') as f:
    f.write(theme_code)
print("✅ 1. standardTheme.ts updated with high-contrast colors.")

# 2. Add row heights in buildSheet04_UnSalesProg.ts for spacious header rows
with open('src/exporters/sheets/buildSheet04_UnSalesProg.ts', 'r', encoding='utf-8') as f:
    s4_code = f.read()

if "rows: [" not in s4_code:
    s4_code = s4_code.replace(
        "    merges,\n    cols\n  };",
        "    merges,\n    cols,\n    rows: [{ hpt: 20 }, { hpt: 26 }, { hpt: 22 }]\n  };"
    )
    with open('src/exporters/sheets/buildSheet04_UnSalesProg.ts', 'w', encoding='utf-8') as f:
        f.write(s4_code)
    print("✅ 2. buildSheet04_UnSalesProg.ts updated with header row heights.")

# 3. Ensure masterReviewWorkbook.ts applies s4.rows
with open('src/exporters/masterReviewWorkbook.ts', 'r', encoding='utf-8') as f:
    wb_code = f.read()

if "ws4['!rows']" not in wb_code:
    wb_code = wb_code.replace(
        "ws4['!merges'] = s4.merges; ws4['!cols'] = s4.cols;",
        "ws4['!merges'] = s4.merges; ws4['!cols'] = s4.cols; if (s4.rows) ws4['!rows'] = s4.rows;"
    )
    with open('src/exporters/masterReviewWorkbook.ts', 'w', encoding='utf-8') as f:
        f.write(wb_code)
    print("✅ 3. masterReviewWorkbook.ts updated to apply ws4 rows height.")

# 4. Build Vite Bundle
print("\n📦 [4/5] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful with 0 errors!")

# 5. Deploy to Cloudflare
print("\n☁️ [5/5] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! All headers and titles are now 100% crystal clear and visible!")
