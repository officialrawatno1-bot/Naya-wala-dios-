export const borderThin = {
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

  // 🔵 Sheet 14: Dark Navy Blue Header with White Text (Activity Type, Speciality, DOB, DOA)
  headerNavyWhiteText: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, // White Bold Font
    fill: { fgColor: { rgb: '1F497D' } },                                    // Dark Navy Blue
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // 🟡 Sheet 14: Doctor Name Yellow Highlight Cell (Screenshot Exact Match!)
  cellYellowDoctorName: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },                                    // Bright Solid Yellow
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
  subHeaderNetPri: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'BDD7EE' } },
    fill: { fgColor: { rgb: 'BDD7EE' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  subHeaderNetSec: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'C6E0B4' } },
    fill: { fgColor: { rgb: 'C6E0B4' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  subHeaderClosing: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'F8CBAD' } },
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
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FF007F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  bannerHotPink: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FF007F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  bannerMagentaCyanText: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '00FFFF' } },
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
  bannerLightGreen: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '6CA84E' } },
    fill: { fgColor: { rgb: '6CA84E' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },

  // ⚪ Sheet 11: Silver Grey & Sky Blue
  headerSilverGrey: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'D9D9D9' } },
    fill: { fgColor: { rgb: 'D9D9D9' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin
  },
  headerSilverGreyLeft: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'D9D9D9' } },
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
