import type { BarcodeProduct, Macros } from '@/lib/types';

/** A food chosen in the Add food sheet, before its amount is picked. */
export type PickedFood =
  | { kind: 'meal' | 'custom'; ref: string; name: string; servingLabel: string; per: Macros }
  | { kind: 'barcode'; product: BarcodeProduct };
