import { INITIAL_UN_PROGRESSION_SEED, YearProgressionStore, ProductProgressionMap } from './seedUnSalesProg';
import { MASTER_PRODUCTS } from './masterProducts';

const STORAGE_KEY = 'dios_un_sales_progression_v1';

export const MONTH_CODES = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

export class UnProgressionStore {
  private data: YearProgressionStore;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): YearProgressionStore {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        MONTH_CODES.forEach(m => {
          if (!parsed[m]) parsed[m] = {};
          const seedMonth = INITIAL_UN_PROGRESSION_SEED[m] || {};
          MASTER_PRODUCTS.forEach(p => {
            if (!parsed[m][p.sn]) {
              parsed[m][p.sn] = seedMonth[p.sn] || { netPri: 0, netSec: 0, closing: 0 };
            }
          });
        });
        return parsed;
      }
    } catch(e) {}

    const initial: YearProgressionStore = {};
    MONTH_CODES.forEach(m => {
      initial[m] = {};
      const seedMonth = INITIAL_UN_PROGRESSION_SEED[m] || {};
      MASTER_PRODUCTS.forEach(p => {
        initial[m][p.sn] = seedMonth[p.sn] || { netPri: 0, netSec: 0, closing: 0 };
      });
    });
    return initial;
  }

  public getData(): YearProgressionStore {
    return this.data;
  }

  public getMonthData(monthCode: string): ProductProgressionMap {
    return this.data[monthCode] || {};
  }

  public updateCell(monthCode: string, sn: number, field: 'netPri' | 'netSec' | 'closing', value: number) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][sn]) this.data[monthCode][sn] = { netPri: 0, netSec: 0, closing: 0 };
    this.data[monthCode][sn][field] = value;
    this.persist();
  }

  public clearMonth(monthCode: string) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    MASTER_PRODUCTS.forEach(p => {
      this.data[monthCode][p.sn] = { netPri: 0, netSec: 0, closing: 0 };
    });
    this.persist();
  }

  public syncFromAggregator(monthCode: string, aggregatedProducts: Array<{ sn: number; netPri?: number; netSec: number; closing: number }>) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    aggregatedProducts.forEach(p => {
      this.data[monthCode][p.sn] = {
        netPri: p.netPri !== undefined ? p.netPri : 0,
        netSec: p.netSec || 0,
        closing: p.closing || 0
      };
    });
    this.persist();
  }

  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadFromStorage();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch(e) {}
  }
}

export const unProgressionStore = new UnProgressionStore();
