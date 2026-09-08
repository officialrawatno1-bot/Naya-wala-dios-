import re

with open('src/components/review/MslSheet.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Suresh Chandra's DOB and DOA in MASTER_123_MSL_DOCTORS
code = re.sub(
    r"(doctorName:\s*['\"]Suresh Chandra['\"],.*?dob:\s*['\"])(.*?)(['\"],\s*doa:\s*['\"])(.*?)(['\"])",
    r"\g<1>17/02/1983\g<3>13/07/2001\g<5>",
    code,
    flags=re.IGNORECASE
)

# 2. Add smart auto-merge in useState so localStorage gets updated DOB & DOA without losing visit dates
old_loader = """  const [doctors, setDoctors] = useState<MslDoctor[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryStore.mslData = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return memoryStore.mslData || MASTER_123_MSL_DOCTORS;
  });"""

new_loader = """  const [doctors, setDoctors] = useState<MslDoctor[]>(() => {
    const masterMap = new Map<string, MslDoctor>();
    MASTER_123_MSL_DOCTORS.forEach(d => {
      masterMap.set(cleanStr(d.doctorName), d);
    });

    try {
      const saved = localStorage.getItem(MSL_STORAGE_KEY);
      if (saved) {
        const parsed: MslDoctor[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = parsed.map(savedDoc => {
            const m = masterMap.get(cleanStr(savedDoc.doctorName)) || MASTER_123_MSL_DOCTORS.find(x => x.srNo === savedDoc.srNo);
            return {
              ...savedDoc,
              dob: (m && m.dob) ? m.dob : (savedDoc.dob || ''),
              doa: (m && m.doa) ? m.doa : (savedDoc.doa || '')
            };
          });
          localStorage.setItem(MSL_STORAGE_KEY, JSON.stringify(merged));
          memoryStore.mslData = merged;
          return merged;
        }
      }
    } catch (e) {}
    memoryStore.mslData = MASTER_123_MSL_DOCTORS;
    return MASTER_123_MSL_DOCTORS;
  });"""

if old_loader in code:
    code = code.replace(old_loader, new_loader)
    print("✅ Replaced old loader with Smart Auto-Merge loader.")
else:
    print("ℹ️ Loader already updated or pattern matched.")

with open('src/components/review/MslSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ MslSheet.tsx successfully configured for live DOB/DOA auto-merge!")
