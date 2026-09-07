import * as pdfjsLib from 'pdfjs-dist';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface PartyParseSummary {
  partyName: string;
  fileName: string;
  itemCount: number;
  totalSales: number;
  totalClosing: number;
  items: Record<number, { sales: number; closing: number }>;
}

export interface AggregatedProduct {
  sn: number;
  name: string;
  pts: number;
  netPri: number;
  netSec: number;
  closing: number;
  priValue: number;
  salesValue: number;
  closingValue: number;
  partyBreakdown: Record<string, { partyName: string; sales: number; closing: number }>;
}

export function cleanStr(s: string): string {
  return (s || '')
    .toUpperCase()
    .replace(/([A-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Z])/g, '$1 $2')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasWord(text: string, word: string): boolean {
  const cleanW = word.replace(/[^A-Z0-9]/gi, '\\$&');
  const regex = new RegExp(`\\b${cleanW}\\b`, 'i');
  return regex.test(text);
}

const PROD_BY_SN: Record<number, MasterProduct> = {};
MASTER_PRODUCTS.forEach(p => { PROD_BY_SN[p.sn] = p; });

export function matchMasterProduct(rawName: string): MasterProduct | null {
  if (!rawName) return null;
  const c = cleanStr(rawName);

  // 1. VINTEL FAMILY
  if (c.includes('VINTEL')) {
    if (c.includes('6 25') || c.includes('625') || c.includes('6.25')) return PROD_BY_SN[61]; // VINTEL CTC 6.25
    if (hasWord(c, 'CTC')) return PROD_BY_SN[62]; // VINTEL CTC TAB
    if (hasWord(c, 'CT')) return PROD_BY_SN[60]; // VINTEL CT TAB
    if (hasWord(c, 'CD')) return PROD_BY_SN[59]; // VINTEL CD TAB
    if (hasWord(c, 'AM') || c.includes('AM 40') || c.includes('40 AM') || c.includes('AM40')) return PROD_BY_SN[58]; // VINTEL AM40 TAB
    if (hasWord(c, 'H') && (hasWord(c, '80') || c.includes('H 80') || c.includes('H80'))) return PROD_BY_SN[64]; // VINTEL H80 TAB
    if (hasWord(c, 'H') && (hasWord(c, '40') || c.includes('H 40') || c.includes('H40'))) return PROD_BY_SN[63]; // VINTEL H40 TAB
    if (hasWord(c, 'M') && hasWord(c, '25')) return PROD_BY_SN[65]; // Vintel M25 TAB
    if (hasWord(c, 'M') && hasWord(c, '50')) return PROD_BY_SN[66]; // Vintel M50 TAB
    if (hasWord(c, '20')) return PROD_BY_SN[55]; // VINTEL 20 TAB
    if (hasWord(c, '80')) return PROD_BY_SN[57]; // VINTEL 80 TAB
    return PROD_BY_SN[56]; // VINTEL 40 TAB
  }

  // 2. LINAGET FAMILY
  if (c.includes('LINAGET')) {
    if (c.includes('OD') && (c.includes('1000') || c.includes('5 1000') || c.includes('5/1000'))) return PROD_BY_SN[23];
    if (c.includes('OD') || c.includes('5 500') || c.includes('5/500')) return PROD_BY_SN[24];
    if (hasWord(c, 'DM')) return PROD_BY_SN[19];
    if (hasWord(c, 'D')) return PROD_BY_SN[21];
    if (hasWord(c, 'E') || c.includes('E 25') || c.includes('E25')) return PROD_BY_SN[22];
    if (hasWord(c, 'M') && (c.includes('1000') || c.includes('1 000'))) return PROD_BY_SN[25];
    if (hasWord(c, 'M') && c.includes('500')) return PROD_BY_SN[26];
    return PROD_BY_SN[20]; // LINAGET-5
  }

  // 3. VIDMET FAMILY
  if (c.includes('VIDMET')) {
    if (hasWord(c, 'G') || c.includes('G 80') || c.includes('G80')) return PROD_BY_SN[52];
    if (c.includes('1000') || c.includes('1GM') || c.includes('1 GM') || c.includes('1000MG')) return PROD_BY_SN[53];
    if (c.includes('500') || c.includes('500MG')) return PROD_BY_SN[54];
    return PROD_BY_SN[54];
  }

  // 4. PREMYLIN FAMILY
  if (c.includes('PREMYLIN')) {
    if (hasWord(c, 'SR') || c.includes('MSR') || c.includes('M SR')) return PROD_BY_SN[32];
    if (c.includes('75') || c.includes('M 75')) return PROD_BY_SN[31];
    return PROD_BY_SN[31];
  }

  // 5. VALROS FAMILY
  if (c.includes('VALROS')) {
    if (c.includes('EZ') && (c.includes('40') || c.includes('EZ 40'))) return PROD_BY_SN[44];
    if (c.includes('EZ') && (c.includes('20') || c.includes('EZ 20'))) return PROD_BY_SN[43];
    if (c.includes('EZ')) return PROD_BY_SN[42];
    if (c.includes('GOLD') && (c.includes('20') || c.includes('GOLD 20'))) return PROD_BY_SN[47];
    if (c.includes('GOLD')) return PROD_BY_SN[46];
    if (c.includes('ASP') && (c.includes('150') || c.includes('ASP 150'))) return PROD_BY_SN[41];
    if (c.includes('ASP')) return PROD_BY_SN[40];
    if (hasWord(c, 'F') && (hasWord(c, '20') || c.includes('F 20') || c.includes('F20'))) return PROD_BY_SN[48];
    if (hasWord(c, 'F')) return PROD_BY_SN[45];
    if (hasWord(c, '40')) return PROD_BY_SN[39];
    if (hasWord(c, '20')) return PROD_BY_SN[38];
    if (hasWord(c, '10')) return PROD_BY_SN[37];
    return PROD_BY_SN[37];
  }

  // 6. VIDGLIT FAMILY
  if (c.includes('VIDGLIT')) {
    if (c.includes('FORTE') || c.includes('FOTRE')) return PROD_BY_SN[49];
    if (hasWord(c, 'M')) return PROD_BY_SN[50];
    return PROD_BY_SN[51];
  }

  // 7. CALGYM FAMILY
  if (c.includes('CALGYM')) {
    if (c.includes('60') || c.includes('60K')) return PROD_BY_SN[1];
    return PROD_BY_SN[2];
  }

  // 8. XILDA FAMILY
  if (c.includes('XILDA')) {
    if (c.includes('1000') || (hasWord(c, 'M') && c.includes('1000'))) return PROD_BY_SN[70];
    if (hasWord(c, 'M') || c.includes('500')) return PROD_BY_SN[71];
    if (hasWord(c, 'P')) return PROD_BY_SN[72];
    return PROD_BY_SN[69];
  }

  // 9. VINVES FAMILY
  if (c.includes('VINVES') || c.includes('VINVSE')) {
    if (c.includes('100')) return PROD_BY_SN[67];
    return PROD_BY_SN[68];
  }

  // 10. SOLEM FAMILY
  if (c.includes('SOLEM')) {
    if (c.includes('250')) return PROD_BY_SN[35];
    return PROD_BY_SN[36];
  }

  // 11. ESIPRAM FAMILY
  if (c.includes('ESIPRAM')) {
    if (c.includes('PLUS')) return PROD_BY_SN[13];
    return PROD_BY_SN[12];
  }

  // 12. FITJEE FAMILY
  if (c.includes('FITJEE')) {
    if (c.includes('Q') || c.includes('Q10')) return PROD_BY_SN[17];
    if (c.includes('DM')) return PROD_BY_SN[16];
    if (c.includes('CAPSULE')) return PROD_BY_SN[15];
    return PROD_BY_SN[14];
  }

  // 13. CITICURE FAMILY
  if (c.includes('CITICURE')) {
    if (c.includes('PLUS')) return PROD_BY_SN[6];
    return PROD_BY_SN[5];
  }

  // 14. OTHERS (Strict word boundaries to avoid collision)
  if (c.includes('CILDIOS')) {
    if (c.includes('20')) return PROD_BY_SN[4];
    return PROD_BY_SN[3];
  }
  if (c.includes('METDIOS')) {
    if (c.includes('50')) return PROD_BY_SN[28];
    return PROD_BY_SN[27];
  }
  if (c.includes('DIOZAM')) {
    if (c.includes('5')) return PROD_BY_SN[11];
    return PROD_BY_SN[10];
  }
  if (c.includes('NEUTOCID')) {
    if (c.includes('DSR')) return PROD_BY_SN[29];
    return PROD_BY_SN[30];
  }
  if (c.includes('PROSTADO')) {
    if (hasWord(c, 'D')) return PROD_BY_SN[33]; // PROSTADO D TAB
    return PROD_BY_SN[34]; // PROSTADO TAB
  }
  if (c.includes('DIOFLAM')) return PROD_BY_SN[7];
  if (c.includes('DIOMILIN')) return PROD_BY_SN[8];
  if (c.includes('DIOSGLT')) return PROD_BY_SN[9];
  if (c.includes('ISIRON')) return PROD_BY_SN[18];
  if (c.includes('ZIRON')) return PROD_BY_SN[73];

  return null;
}
