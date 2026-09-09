import { MASTER_PRODUCTS } from '../data/masterProducts';
import { RetailerSaleRecord } from '../parsers/retailerParsers/dwarikaRetailerParser';

const STORAGE_KEY = 'dios_partywise_aggregator_vault_v1';

export interface RetailerConsolidatedProfile {
  key: string;
  retailerName: string;
  address: string;
  linkedDoctor?: string;
  stockists: string[];
  totalQty: number;
  totalAmount: number;
  items: Record<number, { salesQty: number; freeQty: number; amount: number; stockists: string[] }>;
}

export class PartywiseAggregatorStore {
  public data: Record<string, RetailerSaleRecord[]>;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  public setPartyRecords(monthCode: string, records: RetailerSaleRecord[]) {
    this.data[monthCode] = records;
    this.persist();
  }

  public addPartyRecords(monthCode: string, records: RetailerSaleRecord[]) {
    this.data[monthCode] = records;
    this.persist();
  }

  public clearMonth(monthCode: string) {
    delete this.data[monthCode];
    this.persist();
  }

  public getMonthRetailers(monthCode: string): RetailerConsolidatedProfile[] {
    const records = this.data[monthCode] || [];
    const map: Record<string, RetailerConsolidatedProfile> = {};

    records.forEach(r => {
      const cleanKey = `${r.retailerName} (${r.address})`.toUpperCase().trim();
      if (!map[cleanKey]) {
        map[cleanKey] = {
          key: cleanKey,
          retailerName: r.retailerName,
          address: r.address,
          stockists: ['Dwarika'],
          totalQty: 0,
          totalAmount: 0,
          items: {}
        };
      }

      const prof = map[cleanKey];
      prof.totalQty += r.salesQty;
      prof.totalAmount += r.amount;

      if (!prof.items[r.productSn]) {
        prof.items[r.productSn] = { salesQty: 0, freeQty: 0, amount: 0, stockists: ['Dwarika'] };
      }
      prof.items[r.productSn].salesQty += r.salesQty;
      prof.items[r.productSn].freeQty += r.freeQty;
      prof.items[r.productSn].amount += r.amount;
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  public linkDoctorToRetailer(monthCode: string, retailerKey: string, doctorName: string) {
    try {
      const mappings = JSON.parse(localStorage.getItem('dios_retailer_doctor_mappings_v1') || '{}');
      mappings[retailerKey] = doctorName;
      localStorage.setItem('dios_retailer_doctor_mappings_v1', JSON.stringify(mappings));
    } catch (e) {}
  }

  public getLinkedDoctor(retailerKey: string): string {
    try {
      const mappings = JSON.parse(localStorage.getItem('dios_retailer_doctor_mappings_v1') || '{}');
      return mappings[retailerKey] || '';
    } catch (e) {
      return '';
    }
  }

  public persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }
}

export const partywiseAggregatorStore = new PartywiseAggregatorStore();
