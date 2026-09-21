/**
 * Meals that have a photo at public/images/meals/<slug>.webp.
 *
 * Kept as an explicit list rather than probing for the file: a probe would fire a
 * 404 for every dish without a photo and flash the fallback on screen. Add the slug
 * here when you add a photo.
 */
export const MEAL_PHOTOS: ReadonlySet<string> = new Set([
  'chole-jeera-rice',
  'dal-rice-mixed-veg',
  'egg-curry-rice',
  'idli-sambar',
  'khaman-dhokla',
  'masala-dosa-sambar',
  'moong-dal-chilla-curd',
  'moong-khichdi-curd',
  'palak-paneer-roti',
  'paneer-bhurji-roti',
  'paneer-paratha-curd',
  'poha-peanuts',
  'rajma-chawal',
  'sprouts-chaat',
  'tandoori-chicken-roti',
]);

export function mealPhotoSrc(slug: string): string | null {
  return MEAL_PHOTOS.has(slug) ? `/images/meals/${slug}.webp` : null;
}
