import { MASTER_PRODUCTS, MasterProduct } from './masterProducts';
import { partywiseAggregatorStore } from './partywiseAggregatorStore';

export interface FreeGoodsItem {
  sn: number;
  productName: string;
  pts: number;
  qty: number | '';
  amount: number;
  chemistCount?: number;
}

export interface ChemistFreeDistributionItem {
  monthCode: string;
  retailerName: string;
  address: string;
  salesQty: number;
  freeQty: number;
  totalUnits: number;
  rate: number;
  freeAmount: number;
}

export interface PartyFreeGoodsSummary {
  partyName: string;
  monthCodes: string[];
  items: Record<number, FreeGoodsItem>;
  totalQty: number;
  totalAmount: number;
}

export const FREE_GOODS_PARTIES = [
  { id: 'dwarika', name: 'Dwarika Medicals', tag: 'Dwarika' },
  { id: 'modi', name: 'Modi Distributors', tag: 'Modi' },
  { id: 'vardhman', name: 'Shree Vardhman', tag: 'Vardhman' },
  { id: 'nagda', name: 'Nagda Distributors', tag: 'Nagda' },
  { id: 'sun', name: 'Sun Distributors', tag: 'Sun' },
  { id: 'rp', name: 'R.P. Agencies', tag: 'R.P.' },
];

const STORAGE_KEY = 'dios_free_goods_vault_v1';

export class FreeGoodsStore {
  public data: Record<string, Record<string, Record<number, number>>>;

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

  // 🌟 MULTI-MONTH AUTO-SYNC FROM PARTYWISE ANALYSIS
  public syncMultiMonthFromPartywise(monthCodes: string[], partyId: string = 'dwarika'): { syncedCount: number; totalFreeUnits: number } {
    let syncedCount = 0;
    let totalFreeUnits = 0;

    monthCodes.forEach(mCode => {
      if (!this.data[mCode]) this.data[mCode] = {};
      if (!this.data[mCode][partyId]) this.data[mCode][partyId] = {};

      const partyRecords = partywiseAggregatorStore.data[mCode] || [];
      const productFreeMap: Record<number, number> = {};

      partyRecords.forEach(r => {
        if (r.freeQty > 0) {
          productFreeMap[r.productSn] = (productFreeMap[r.productSn] || 0) + r.freeQty;
          totalFreeUnits += r.freeQty;
        }
      });

      MASTER_PRODUCTS.forEach(p => {
        if (productFreeMap[p.sn] !== undefined && productFreeMap[p.sn] > 0) {
          this.data[mCode][partyId][p.sn] = productFreeMap[p.sn];
          syncedCount++;
        }
      });
    });

    this.persist();
    return { syncedCount, totalFreeUnits };
  }

  // 🌟 GET SPECIFIC CHEMISTS WHO RECEIVED FREE GOODS ACROSS SELECTED MONTHS
  public getMultiMonthChemistFreeDistribution(monthCodes: string[], partyId: string, productSn: number): ChemistFreeDistributionItem[] {
    const list: ChemistFreeDistributionItem[] = [];

    monthCodes.forEach(mCode => {
      const partyRecords = partywiseAggregatorStore.data[mCode] || [];
      partyRecords.forEach(r => {
        if (r.productSn === productSn && r.freeQty > 0) {
          const rate = r.rate || 0;
          list.push({
            monthCode: mCode,
            retailerName: r.retailerName,
            address: r.address,
            salesQty: r.salesQty || 0,
            freeQty: r.freeQty,
            totalUnits: (r.salesQty || 0) + r.freeQty,
            rate: rate,
            freeAmount: Number((r.freeQty * rate).toFixed(2))
          });
        }
      });
    });

    return list.sort((a, b) => b.freeQty - a.freeQty);
  }

  // 🌟 MULTI-MONTH CONSOLIDATED SUMMARY PER PARTY
  public getMultiMonthPartySummary(monthCodes: string[], partyId: string, partyName: string): PartyFreeGoodsSummary {
    const items: Record<number, FreeGoodsItem> = {};
    let totalQty = 0;
    let totalAmount = 0;

    MASTER_PRODUCTS.forEach(p => {
      let aggregatedQty = 0;
      let hasValue = false;

      monthCodes.forEach(mCode => {
        const mQtys = this.data[mCode]?.[partyId] || {};
        if (mQtys[p.sn] !== undefined) {
          aggregatedQty += Number(mQtys[p.sn]) || 0;
          hasValue = true;
        }
      });

      // Count chemists receiving free goods across selected months
      let totalChemistsCount = 0;
      monthCodes.forEach(mCode => {
        const records = partywiseAggregatorStore.data[mCode] || [];
        totalChemistsCount += records.filter(r => r.productSn === p.sn && r.freeQty > 0).length;
      });

      const displayQty = (hasValue && aggregatedQty > 0) ? aggregatedQty : '';
      const numQty = typeof displayQty === 'number' ? displayQty : 0;
      const amt = Number((numQty * p.pts).toFixed(2));

      items[p.sn] = {
        sn: p.sn,
        productName: p.name,
        pts: p.pts,
        qty: displayQty,
        amount: amt,
        chemistCount: totalChemistsCount
      };

      totalQty += numQty;
      totalAmount += amt;
    });

    return {
      partyName,
      monthCodes,
      items,
      totalQty,
      totalAmount: Number(totalAmount.toFixed(2))
    };
  }

  public updateCell(monthCode: string, partyId: string, sn: number, qtyVal: any) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) this.data[monthCode][partyId] = {};

    const num = qtyVal === '' ? 0 : (parseFloat(qtyVal) || 0);
    if (num === 0) {
      delete this.data[monthCode][partyId][sn];
    } else {
      this.data[monthCode][partyId][sn] = num;
    }
    this.persist();
  }

  public clearMultiMonth(monthCodes: string[], partyId: string) {
    monthCodes.forEach(mCode => {
      if (this.data[mCode]) {
        this.data[mCode][partyId] = {};
      }
    });
    this.persist();
  }

  public persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }
}

export const freeGoodsStore = new FreeGoodsStore();
