import os, re

print("==========================================================================")
print("🛠️ [ADDING MANUAL / CUSTOM CATEGORY TO SMART EXPENSE BUILDER]...")
print("==========================================================================")

with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state for customCategoryName and customCategoryAmount if not present
if "const [customCategoryName, setCustomCategoryName]" not in code:
    code = code.replace(
        "const [activeDoctorSearchCategory, setActiveDoctorSearchCategory] = useState<'DOB' | 'DOA' | 'FRUITS' | null>(null);",
        "const [activeDoctorSearchCategory, setActiveDoctorSearchCategory] = useState<'DOB' | 'DOA' | 'FRUITS' | null>(null);\n  // 🌟 MANUAL / CUSTOM CATEGORY STATE\n  const [customCategoryName, setCustomCategoryName] = useState('');\n  const [customCategoryAmount, setCustomCategoryAmount] = useState('');"
    )

# 2. Add handleAddCustomCategory function if not present
if "const handleAddCustomCategory = () => {" not in code:
    custom_func = """  // 🌟 MANUAL / CUSTOM CATEGORY ADD HANDLER
  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) {
      alert("Kripya Category ka naam (e.g. Toll, Courier, Room) zaroor likhein!");
      return;
    }
    const amt = customCategoryAmount === '' ? '' : (parseFloat(customCategoryAmount) || '');
    setSmartItems(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now() + Math.random().toString(36).substring(2, 6),
        category: 'Custom',
        label: customCategoryName.trim(),
        amount: amt
      }
    ]);
    setCustomCategoryName('');
    setCustomCategoryAmount('');
  };
"""
    code = code.replace("  const handleApplySmartExpense = () => {", custom_func + "\n  const handleApplySmartExpense = () => {")

# 3. Add reset custom inputs in handleOpenSmartExpense
if "setCustomCategoryName('');" not in code:
    code = code.replace(
        "setDoctorSearchQuery('');",
        "setDoctorSearchQuery('');\n    setCustomCategoryName('');\n    setCustomCategoryAmount('');"
    )

# 4. Insert Custom Category UI section in the Modal
custom_ui_section = """            {/* 🌟 MANUAL / CUSTOM CATEGORY INPUT ROW */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2 text-xs">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={13} className="text-amber-300" />
                <span>Custom / Manual Category (Inke alawa kuch aur kharcha):</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Toll Tax, Courier, Station Tea, Room)..."
                  value={customCategoryName}
                  onChange={e => setCustomCategoryName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={customCategoryAmount}
                    onChange={e => setCustomCategoryAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 text-yellow-300 font-mono font-bold text-right rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            </div>
"""

# Insert right after the preset buttons section
target_marker = "{/* MASTER DOCTOR SEARCH BOX */}"
if "Custom / Manual Category (Inke alawa kuch aur kharcha):" not in code:
    code = code.replace(target_marker, custom_ui_section + "\n            " + target_marker)

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ Custom Category & Amount functionality added to ExpenseWorkspace.tsx.")
