import os, sys

print("==========================================================================")
print("🎨 [APPLYING EXACT CBO LILAC/LAVENDER COLOR: RGB(204, 208, 238)]...")
print("==========================================================================")

with open('src/exporters/expensePdfExporter.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any old [180, 198, 231] or [217, 225, 242] with exact CBO Lavender [204, 208, 238]
code = code.replace("fillColor: [180, 198, 231]", "fillColor: [204, 208, 238]")
code = code.replace("doc.setFillColor(217, 225, 242);", "doc.setFillColor(204, 208, 238);")
code = code.replace("fillColor: [241, 245, 249]", "fillColor: [204, 208, 238]")
code = code.replace("fillColor: [254, 240, 138]", "fillColor: [204, 208, 238]")

# Ensure table lines are sharp black matching Image 1
code = code.replace("lineColor: [148, 163, 184]", "lineColor: [0, 0, 0]")
code = code.replace("lineColor: [100, 116, 139]", "lineColor: [0, 0, 0]")
code = code.replace("doc.setDrawColor(180, 198, 231);", "doc.setDrawColor(0, 0, 0);")

with open('src/exporters/expensePdfExporter.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ Exact CBO Lavender RGB(204, 208, 238) & Black Borders injected into expensePdfExporter.ts")
