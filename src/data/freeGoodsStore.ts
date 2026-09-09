import { MASTER_PRODUCTS } from './masterProducts';

export interface FreeGoodsItem {
  sn: number;
  productName: string;
  pts: number;
  qty: number | '';
  amount: number;
}

export interface PartyFreeGoodsSummary {
  partyName: string;
  monthCode: string;
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

// Seed data for June based on user uploads
const INITIAL_JUNE_SEED: Record<string, Record<number, { qty: number }>> = {
  dwarika: {
    1: { qty: 25 },   // CALGYM 60K CAPS
    8: { qty: 3 },    // DIOSGLT 10 TAB
    12: { qty: 41 },  // ESIPRAM PLUS TAB
    15: { qty: 1 },   // FITJEE Q10 TAB
    16: { qty: 2 },   // ISIRON CAPS
    19: { qty: 3 },   // LINAGET-D TAB
    29: { qty: 3 },   // PREMYLIN MSR TAB
    30: { qty: 1 },   // PROSTADO D TAB
    34: { qty: 4 },   // VALROS 10 TAB
    36: { qty: 1 },   // VALROS ASP CAPS
    38: { qty: 24 },  // VALROS F TAB
    43: { qty: 4 },   // VIDGLIT M TAB
    44: { qty: 6 },   // VIDGLIT TAB
    45: { qty: 7 },   // VIDMET G 80 TAB
    47: { qty: 8 },   // VIDMET SR 500MG TAB
    49: { qty: 95 },  // VINTEL 40 TAB
    51: { qty: 2 },   // VINTEL AM40 TAB
    54: { qty: 44 },  // VINTEL CTC TAB
    55: { qty: 7 },   // VINTEL H40 TAB
    63: { qty: 2 },   // XILDA M 500 TAB
  },
  modi: {
    1: { qty: 22 },   // CALGYM 60K CAPS
    2: { qty: 10 },   // CALGYM TAB
    7: { qty: 12 },   // DIOMILIN NT TABLET
    11: { qty: 10 },  // ESIPRAM 10MG TAB
    12: { qty: 3 },   // ESIPRAM PLUS TAB
    22: { qty: 6 },   // LINAGET-M-OD5/500 TAB
    29: { qty: 34 },  // PREMYLIN MSR TAB
    49: { qty: 3 },   // VINTEL 40 TAB
    54: { qty: 2 },   // VINTEL CTC TAB
  },
  vardhman: {
    1: { qty: 1 },    // CALGYM 60K CAPS
    19: { qty: 2 },   // LINAGET-D TAB
    24: { qty: 2 },   // LINAGET-M500 TAB
    34: { qty: 1 },   // VALROS 10 TAB
    35: { qty: 3 },   // VALROS 20 TAB
    38: { qty: 3 },   // VALROS F TAB
    47: { qty: 10 },  // VIDMET SR 500MG TAB
    49: { qty: 6 },   // VINTEL 40 TAB
    51: { qty: 1 },   // VINTEL AM40 TAB
    53: { qty: 10 },  // VINTEL CT TAB
    54: { qty: 3 },   // VINTEL CTC TAB
    57: { qty: 1 },   // Vintel M25 TAB
    66: { qty: 10 },  // VALROS EZ 20
  }
};

export class FreeGoodsStore {
  private data: Record<string, Record<string, Record<number, number>>>; // { monthCode: { partyId: { sn: qty } } }

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Default with June seed
    const initial: Record<string, Record<string, Record<number, number>>> = {
      JUN: INITIAL_JUNE_SEED
    };
    return initial;
  }

  public getPartySummary(monthCode: string, partyId: string, partyName: string): PartyFreeGoodsSummary {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) {
      this.data[monthCode][partyId] = monthCode === 'JUN' ? (INITIAL_JUNE_SEED[partyId] || {}) : {};
    }

    const partyQtys = this.data[monthCode][partyId];
    const items: Record<number, FreeGoodsItem> = {};
    let totalQty = 0;
    let totalAmount = 0;

    MASTER_PRODUCTS.forEach(p => {
      const q = partyQtys[p.sn] !== undefined ? partyQtys[p.sn] : '';
      const qtyNum = typeof q === 'number' ? q : 0;
      const amount = Number((qtyNum * p.pts).toFixed(2));

      items[p.sn] = {
        sn: p.sn,
        productName: p.name,
        pts: p.pts,
        qty: q,
        amount
      };

      totalQty += qtyNum;
      totalAmount += amount;
    });

    return {
      partyName,
      monthCode,
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

  public clearMonth(monthCode: string, partyId: string) {
    if (this.data[monthCode]) {
      this.data[monthCode][partyId] = {};
      this.persist();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }
}

export const freeGoodsStore = new FreeGoodsStore();
