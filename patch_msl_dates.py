import re

dates_map = {
    "ABHAY JAIN": ("12/12/1972", ""),
    "ABHIJEET BASU": ("12/12/1972", "19/04/2000"),
    "ABHISHEK KUMAR": ("26/05/1990", ""),
    "AKVATS": ("02/08/2019", ""),
    "AMEET MEHTA": ("27/04/1900", "19/05/1900"),
    "AMIT KHANDELWAL": ("03/04/1977", ""),
    "ANISH JAIN": ("16/12/2019", ""),
    "ANMOL PAGARIYA": ("23/01/2019", ""),
    "ANURAG JAIN": ("12/03/1979", ""),
    "BALDEV MEENA": ("05/07/1978", "16/01/2005"),
    "BHUPESH PARTANI": ("23/10/2019", ""),
    "BIPIN CHANDRA ADITYA DASARI": ("13/05/1990", ""),
    "BS BOMB": ("08/12/2019", ""),
    "CHIRAG RATHOR": ("03/04/1990", "10/02/2000"),
    "CPPUROHIT": ("02/11/1971", ""),
    "D C SHARMA": ("12/05/2019", ""),
    "DENY": ("03/06/2019", "30/04/1998"),
    "DEEPAK AAMETHA": ("17/03/1980", ""),
    "DILIP JAIN": ("24/04/1982", ""),
    "DP SINGH": ("23/11/2019", ""),
    "G K MUKHIYA": ("13/05/1973", "11/03/2009"),
    "GOURAV KUMAR MITTAL": ("11/09/1900", "23/06/1900"),
    "HARISH CHARPOTA": ("16/10/1900", "27/04/1900"),
    "HARISH SANADHY": ("01/01/1970", ""),
    "HC SONI": ("25/10/1955", "23/11/2023"),
    "HEMANT MAHUR": ("25/03/1996", ""),
    "HITESH YADAV": ("11/05/1900", "31/01/2009"),
    "JAGDISH VISHNOI": ("03/03/1974", "25/12/2009"),
    "JAY CHORDIYA": ("21/04/2019", ""),
    "JAYESH GANDHI": ("10/06/2019", ""),
    "JC DEVPURA": ("30/03/2019", ""),
    "JIMESH PANDIYA": ("22/03/1900", "06/12/1900"),
    "JITENA JINGAR": ("24/09/2019", ""),
    "KANTI LAL MEGWAL": ("09/01/2019", ""),
    "KAPIL BHARGAV": ("16/12/2019", "27/04/1998"),
    "KAVITA BADJATIYA": ("26/08/2019", "09/02/2007"),
    "KC JAIN": ("24/07/2019", "27/11/2001"),
    "KIRIT GANDHI": ("11/07/2019", ""),
    "KN DAS": ("15/11/2019", "15/05/2009"),
    "KRIPA SHANKAR": ("15/09/2019", ""),
    "LALIT JAINANI": ("11/04/2019", ""),
    "LALIT SHREEMALI": ("20/12/2019", "27/04/2008"),
    "MADHUP BAXI": ("29/01/2019", ""),
    "MAHESH DAVE": ("03/03/2019", ""),
    "MANU SHARMA": ("05/12/2019", ""),
    "MONA DINGRA": ("18/07/1900", "10/02/1900"),
    "MUKESH SHARMA": ("07/07/2019", ""),
    "NAVGEET MATHUR": ("28/03/1982", "06/12/2009"),
    "NAVNEET PATEL KIYDA": ("30/06/1900", "23/04/1900"),
    "NILESH PATHIRA": ("28/01/1900", "14/04/1900"),
    "PARAS JAIN": ("23/11/2019", ""),
    "PRASHANT BADJATIYA": ("25/06/2000", "02/11/2025"),
    "PRERNA BHARGAV": ("23/03/2019", ""),
    "RAHUL PANCHAL": ("21/04/2019", ""),
    "RAJESH SIROIYA": ("04/10/2019", ""),
    "RAMESH PATEL": ("30/09/2019", ""),
    "RK MALOT": ("09/05/2019", ""),
    "RK SHARMA": ("14/01/2019", ""),
    "SAFDAR HUSSAIN": ("05/05/2019", ""),
    "SALMA SHAH": ("07/03/2019", "01/01/2000"),
    "SANDEEP BHATNAGAR": ("13/02/2019", "27/04/1993"),
    "SANDEEP KANSARA": ("22/10/2019", ""),
    "SHUSHIL CHOUHAN": ("17/02/2019", ""),
    "SUMIT SIROIYA": ("14/01/2019", ""),
    "SUNIL UPADHAY": ("07/02/2019", ""),
    "SURESH CHANDRA": ("17/02/1983", "13/07/2001"),
    "TARUN MATHUR": ("02/08/1979", ""),
    "UDAY BHOMIK": ("08/04/2019", ""),
    "VIJAY GOYAL": ("01/09/2019", "11/12/2008"),
    "VINOD BOKADIA": ("24/02/1988", "02/05/2014"),
    "VINOD KUMAR RAI": ("22/12/1969", "28/04/1999"),
    "VINOD MEHTA": ("02/06/2019", "02/12/2009"),
    "YN VERMA": ("03/07/2019", "11/05/1900")
}

def clean(s):
    return re.sub(r'[^A-Z0-9]', '', s.upper())

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    updated = 0
    for name, (dob, doa) in dates_map.items():
        c_name = clean(name)
        pattern = re.compile(rf"(doctorName:\s*['\"][^'\"]*?['\"],.*?dob:\s*['\"])(.*?)(['\"],\s*doa:\s*['\"])(.*?)(['\"])", re.IGNORECASE)
        
        def repl(match):
            nonlocal updated
            full_block = match.group(0)
            if c_name in clean(full_block):
                updated += 1
                return f"{match.group(1)}{dob}{match.group(3)}{doa}{match.group(5)}"
            return full_block

        content = pattern.sub(repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Successfully patched {filepath} (Updated {updated} entries)")

update_file('src/components/review/MslSheet.tsx')
update_file('src/exporters/sheets/buildSheet14_Msl.ts')
