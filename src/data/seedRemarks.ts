import { memoryStore } from './memoryStore';

memoryStore.salesBreakdown['sales_returns_APR'] = [
  { id: 'sr_apr_1', partyName: 'NAGDA DISTRIBUTORS', amount: 32000, note: 'Apr Batch Pullback' },
  { id: 'sr_apr_2', partyName: 'MODI DISTRIBUTORS', amount: 20875, note: 'Apr Return' }
];

memoryStore.salesBreakdown['sales_returns_JUN'] = [
  { id: 'sr_jun_1', partyName: 'SHREE VARDHMAN PHARMA', amount: 14244, note: 'Jun Replacement' }
];

memoryStore.salesBreakdown['expiry_APR'] = [
  { id: 'ex_apr_1', partyName: 'NAGDA DISTRIBUTORS', amount: 22000, note: 'Apr Expired' },
  { id: 'ex_apr_2', partyName: 'DWARIKA MEDICALS', amount: 15317, note: 'Apr Expiry' }
];

memoryStore.salesBreakdown['expiry_JUL'] = [
  { id: 'ex_jul_1', partyName: 'MODI DISTRIBUTORS', amount: 26845, note: 'Jul Expiry Pullback' }
];
