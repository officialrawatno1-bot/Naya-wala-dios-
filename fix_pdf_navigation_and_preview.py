import os, sys

print("==========================================================================")
print("🛡️ [FIXING PDF PREVIEW & BACK NAVIGATION] LOCKING SESSION TO EXPENSE...")
print("==========================================================================")

# 1. Update src/App.tsx with Session Persistence
app_code = """import React, { useState } from 'react';
import { MainHub } from './components/MainHub';
import { DiosWorkspace } from './components/DiosWorkspace';
import { ReviewFormatWorkspace } from './components/ReviewFormatWorkspace';
import { WebDataWorkspace } from './components/WebDataWorkspace';

export default function App() {
  const [activeProject, setActiveProject] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('dios_active_project') || null;
    } catch {
      return null;
    }
  });

  const handleSetActiveProject = (id: string | null) => {
    setActiveProject(id);
    try {
      if (id) sessionStorage.setItem('dios_active_project', id);
      else {
        sessionStorage.removeItem('dios_active_project');
        sessionStorage.removeItem('dios_web_data_view');
      }
    } catch {}
  };

  if (activeProject === 'dios' || activeProject === 'dios-aggregator') {
    return <DiosWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  if (activeProject === 'dios-review') {
    return <ReviewFormatWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  if (activeProject === 'web-data') {
    return <WebDataWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  return <MainHub onOpenProject={handleSetActiveProject} />;
}
"""

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_code)
print("✅ 1. src/App.tsx session lock active.")

# 2. Update src/components/WebDataWorkspace.tsx with View Persistence
with open('src/components/WebDataWorkspace.tsx', 'r', encoding='utf-8') as f:
    web_code = f.read()

old_state = "const [currentView, setCurrentView] = useState<ViewState>('web-data');"
new_state = """const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const saved = sessionStorage.getItem('dios_web_data_view') as ViewState;
      if (saved && ['web-data', 'statement', 'stockwise-statement', 'earn', 'incentive', 'expense'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'web-data';
  });

  const setAndSaveView = (v: ViewState) => {
    setCurrentView(v);
    try {
      sessionStorage.setItem('dios_web_data_view', v);
    } catch {}
  };"""

if old_state in web_code:
    web_code = web_code.replace(old_state, new_state)

# Replace all setCurrentView with setAndSaveView
web_code = web_code.replace("setCurrentView(", "setAndSaveView(")

with open('src/components/WebDataWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(web_code)
print("✅ 2. src/components/WebDataWorkspace.tsx session lock active.")

# 3. Update src/exporters/expensePdfExporter.ts to return doc & blobUrl
with open('src/exporters/expensePdfExporter.ts', 'r', encoding='utf-8') as f:
    pdf_code = f.read()

# Replace doc.save at the end to return blobUrl & doc
old_save_end = """  // Save PDF
  const fileName = `Expense_Statement_${selectedMonth}_Official.pdf`;
  doc.save(fileName);
}"""

new_save_end = """  // Create Blob & URL for in-app safe preview (No Safari Tab Overwrite)
  const fileName = `Expense_Statement_${selectedMonth}_Official.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { doc, blobUrl, fileName };
}"""

if old_save_end in pdf_code:
    pdf_code = pdf_code.replace(old_save_end, new_save_end)
    pdf_code = pdf_code.replace(
        "export function exportExpenseStatementToPdf(options: ExpensePdfExportOptions) {",
        "export function exportExpenseStatementToPdf(options: ExpensePdfExportOptions): { doc: jsPDF; blobUrl: string; fileName: string } {"
    )
    with open('src/exporters/expensePdfExporter.ts', 'w', encoding='utf-8') as f:
        f.write(pdf_code)
    print("✅ 3. src/exporters/expensePdfExporter.ts configured for In-App preview.")

# 4. Update src/components/ExpenseWorkspace.tsx with In-App Preview Modal & Safe Back
with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    ws_code = f.read()

if "const [pdfPreviewModal, setPdfPreviewModal]" not in ws_code:
    ws_code = ws_code.replace(
        "const [isImporting, setIsImporting] = useState(false);",
        "const [isImporting, setIsImporting] = useState(false);\n  // 🌟 IN-APP PDF PREVIEW MODAL STATE\n  const [pdfPreviewModal, setPdfPreviewModal] = useState<{ doc: any; blobUrl: string; fileName: string } | null>(null);"
    )

old_pdf_handler = """  // 🌟 EXPORT CRYSTAL CLEAR A4 LANDSCAPE VECTOR PDF
  const handleExportPDF = () => {
    exportExpenseStatementToPdf({
      selectedMonth,
      headerInfo,
      rows,
      totals,
      allowanceSummary,
      miscSummary,
      performanceMetrics,
      hideMiscValues,
      blankPerfValues
    });
    setStatusMsg(`🎉 PDF Generated: 'Expense_Statement_${selectedMonth}_Official.pdf' downloaded!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };"""

new_pdf_handler = """  // 🌟 IN-APP PREVIEW & SAFE DOWNLOAD (SAFARI SAFE - NO REDIRECT TO HOME!)
  const handleExportPDF = () => {
    try {
      const res = exportExpenseStatementToPdf({
        selectedMonth,
        headerInfo,
        rows,
        totals,
        allowanceSummary,
        miscSummary,
        performanceMetrics,
        hideMiscValues,
        blankPerfValues
      });
      setPdfPreviewModal(res);
      setStatusMsg("🎉 In-App PDF Preview Ready! Check preview modal below.");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e: any) {
      alert("PDF Error: " + e.message);
    }
  };"""

if old_pdf_handler in ws_code:
    ws_code = ws_code.replace(old_pdf_handler, new_pdf_handler)

# Add Preview Modal before closing div
modal_jsx = """      {/* 🌟 IN-APP PDF PREVIEW MODAL (SAFARI-SAFE, NO REDIRECT TO MAIN SCREEN) */}
      {pdfPreviewModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg"><FileText size={16} /></span>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                    PDF Preview: {pdfPreviewModal.fileName}
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      A4 Landscape
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Tapping Close keeps you right inside Expense Statement!</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    pdfPreviewModal.doc.save(pdfPreviewModal.fileName);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 transition cursor-pointer"
                >
                  <Download size={14} /> ⬇️ Save to iPad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { URL.revokeObjectURL(pdfPreviewModal.blobUrl); } catch(e) {}
                    setPdfPreviewModal(null);
                  }}
                  className="flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <X size={16} /> ✕ Wapas Jayein (Close)
                </button>
              </div>
            </div>

            {/* In-App PDF Viewer Frame */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
              <iframe
                src={pdfPreviewModal.blobUrl}
                title="Expense Statement PDF Preview"
                className="w-full h-full rounded-2xl border border-slate-800"
              />
            </div>

          </div>
        </div>
      )}
"""

if "{/* 🌟 IN-APP PDF PREVIEW MODAL" not in ws_code:
    ws_code = ws_code[:-10] + "\n" + modal_jsx + "\n    </div>\n  );\n};\n"
    with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
        f.write(ws_code)
    print("✅ 4. In-App PDF Preview modal added to ExpenseWorkspace.tsx.")

