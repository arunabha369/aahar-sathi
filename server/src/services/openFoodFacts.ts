import type { Macros } from '../db/diary.ts';

/** A packaged food as the diary needs it, from Open Food Facts (openfoodfacts.org, ODbL). */
export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string | null;
  /** Per 100 g (or 100 ml); null when the product has no nutrition facts. */
  per100: Macros | null;
  /** Per serving, when the label gives a serving; null otherwise. */
  perServing: Macros | null;
  /** The label's serving, e.g. "30 g" or "1 packet (50 g)". */
  servingLabel: string | null;
  /** Grams (or ml) in one serving, when known. */
  servingGrams: number | null;
  /** Whether the amounts are in ml rather than g. */
  liquid: boolean;
}

const FIELDS = 'code,product_name,product_name_en,brands,serving_size,serving_quantity,quantity,nutriments';
// Open Food Facts asks every app to identify itself.
const USER_AGENT = 'AaharSathi/1.0 (https://aaharsathi.in)';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_LIMIT = 500;

const cache = new Map<string, { at: number; product: BarcodeProduct | null }>();

type Nutriments = Record<string, number | string | undefined>;

const number = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/** kcal, falling back to kJ ÷ 4.184 — many labels list only kJ. */
function energyKcal(nutriments: Nutriments, basis: '100g' | 'serving'): number | null {
  const kcal = number(nutriments[`energy-kcal_${basis}`]);
  if (kcal !== null) return kcal;
  const kj = number(nutriments[`energy-kj_${basis}`]) ?? number(nutriments[`energy_${basis}`]);
  return kj === null ? null : kj / 4.184;
}

function macrosFor(nutriments: Nutriments, basis: '100g' | 'serving'): Macros | null {
  const kcal = energyKcal(nutriments, basis);
  if (kcal === null) return null;
  const round1 = (value: number | null) => Math.round((value ?? 0) * 10) / 10;
  return {
    kcal: Math.round(kcal),
    protein: round1(number(nutriments[`proteins_${basis}`])),
    carbs: round1(number(nutriments[`carbohydrates_${basis}`])),
    fat: round1(number(nutriments[`fat_${basis}`])),
  };
}

export function parseProduct(barcode: string, product: Record<string, unknown>): BarcodeProduct {
  const nutriments = (product.nutriments ?? {}) as Nutriments;
  const name =
    String(product.product_name_en || product.product_name || '').trim() || `Product ${barcode}`;
  const brand = String(product.brands ?? '').split(',')[0]?.trim() || null;
  const servingLabel = String(product.serving_size ?? '').trim() || null;
  const servingGrams = number(product.serving_quantity);
  const liquid = /\bml\b|\bl\b/i.test(String(product.quantity ?? '')) || /\bml\b/i.test(servingLabel ?? '');

  const per100 = macrosFor(nutriments, '100g');
  let perServing = macrosFor(nutriments, 'serving');
  // Derive the serving from the per-100 figures when the label states only its size.
  if (!perServing && per100 && servingGrams) {
    const factor = servingGrams / 100;
    perServing = {
      kcal: Math.round(per100.kcal * factor),
      protein: Math.round(per100.protein * factor * 10) / 10,
      carbs: Math.round(per100.carbs * factor * 10) / 10,
      fat: Math.round(per100.fat * factor * 10) / 10,
    };
  }

  return { barcode, name: name.slice(0, 120), brand, per100, perServing, servingLabel, servingGrams, liquid };
}

/** Looks a barcode up on Open Food Facts; null when it isn't in their database. */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const cached = cache.get(barcode);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.product;

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`,
    { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) },
  );
  if (response.status === 404) return remember(barcode, null);
  if (!response.ok) throw new Error(`Open Food Facts answered ${response.status}`);

  const body = (await response.json()) as { status?: number; product?: Record<string, unknown> };
  return remember(barcode, body.status === 1 && body.product ? parseProduct(barcode, body.product) : null);
}

function remember(barcode: string, product: BarcodeProduct | null): BarcodeProduct | null {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(barcode, { at: Date.now(), product });
  return product;
}
