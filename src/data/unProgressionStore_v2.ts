import { INITIAL_UN_PROGRESSION_SEED, YearProgressionStore, ProductProgressionMap } from './seedUnSalesProg';
import { MASTER_PRODUCTS } from './masterProducts';

const STORAGE_KEY_V2 = 'dios_un_sales_progression_v2';
const STORAGE_KEY_V1 = 'dios_un_sales_progression_v1';

export const MONTH_CODES = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

export class UnProgressionStoreV2 {
  public data: YearProgressionStore;

  constructor() {
    this.data = this.loadFromStorage();
  }

  // 🌟 SAFE HYBRID LOADER (Loads V2, falls back to V1, never wipes existing months)
  public loadFromStorage(): YearProgressionStore {
    let parsed: any = null;

    try {
      if (typeof window !== 'undefined') {
        const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
        if (savedV2) {
          parsed = JSON.parse(savedV2);
        } else {
          // Fallback to V1 so user's existing work is instantly preserved
          const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
          if (savedV1) parsed = JSON.parse(savedV1);
        }
      }
    } catch (e) {}

    const store: YearProgressionStore = {};

    MONTH_CODES.forEach(m => {
      store[m] = {};
      const seedMonth = INITIAL_UN_PROGRESSION_SEED[m] || {};
      const savedMonth = parsed && parsed[m] ? parsed[m] : null;

      MASTER_PRODUCTS.forEach(p => {
        if (savedMonth && savedMonth[p.sn]) {
          store[m][p.sn] = { ...savedMonth[p.sn] };
        } else if (seedMonth[p.sn]) {
          store[m][p.sn] = { ...seedMonth[p.sn] };
        } else {
          store[m][p.sn] = { netPri: 0, netSec: 0, closing: 0 };
        }
      });
    });

    return store;
  }

  public getData(): YearProgressionStore {
    return this.data;
  }

  public getMonthData(monthCode: string): ProductProgressionMap {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    return this.data[monthCode];
  }

  // 🌟 ATOMIC DEEP MERGE: Updates ONLY the specified month without wiping any other month!
  public syncFromAggregator(monthCode: string, aggregatedProducts: Array<{ sn: number; netPri?: number; netSec: number; closing: number }>) {
    // 1. Re-read storage so any other months saved recently are preserved
    const latestData = this.loadFromStorage();
    this.data = latestData;

    if (!this.data[monthCode]) this.data[monthCode] = {};

    // 2. Merge only the current month's SKUs
    aggregatedProducts.forEach(p => {
      this.data[monthCode][p.sn] = {
        netPri: p.netPri !== undefined ? p.netPri : (this.data[monthCode][p.sn]?.netPri || 0),
        netSec: p.netSec !== undefined ? p.netSec : (this.data[monthCode][p.sn]?.netSec || 0),
        closing: p.closing !== undefined ? p.closing : (this.data[monthCode][p.sn]?.closing || 0)
      };
    });

    // 3. Persist the FULL 12-month data object back
    this.persist();
  }

  // 🌟 CLOUD HYDRATION: Merges full Cloudflare KV data across all 12 months safely
  public hydrateFromCloud(cloudProgressionData: YearProgressionStore) {
    if (!cloudProgressionData || typeof cloudProgressionData !== 'object') return;

    MONTH_CODES.forEach(m => {
      if (cloudProgressionData[m]) {
        if (!this.data[m]) this.data[m] = {};
        MASTER_PRODUCTS.forEach(p => {
          if (cloudProgressionData[m][p.sn]) {
            this.data[m][p.sn] = { ...cloudProgressionData[m][p.sn] };
          }
        });
      }
    });

    this.persist();
  }

  public updateCell(monthCode: string, sn: number, field: 'netPri' | 'netSec' | 'closing', value: number) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][sn]) this.data[monthCode][sn] = { netPri: 0, netSec: 0, closing: 0 };
    this.data[monthCode][sn][field] = value;
    this.persist();
  }

  // Strictly clears ONLY the target month, never touching the rest of the year
  public clearMonth(monthCode: string) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    MASTER_PRODUCTS.forEach(p => {
      this.data[monthCode][p.sn] = { netPri: 0, netSec: 0, closing: 0 };
    });
    this.persist();
  }

  public persist() {
    try {
      if (typeof window !== 'undefined') {
        const payload = JSON.stringify(this.data);
        localStorage.setItem(STORAGE_KEY_V2, payload);
        localStorage.setItem(STORAGE_KEY_V1, payload); // Keeps V1 compatible too
      }
    } catch (e) {}
  }
}

export const unProgressionStoreV2 = new UnProgressionStoreV2();
