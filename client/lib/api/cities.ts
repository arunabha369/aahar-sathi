import 'server-only';
import { serverFetch } from '@/lib/api/server';
import type { City } from '@/lib/types';

/** A city's display name from its key, for the sehri and iftar notes. */
export async function cityName(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  const { cities } = await serverFetch<{ cities: City[] }>('/fasting/cities');
  return cities.find((city) => city.key === key)?.name ?? null;
}
