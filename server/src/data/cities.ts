/**
 * Cities offered for sehri/iftar times and Ekadashi sunrise. All are on Indian Standard
 * Time (UTC+5:30), which the almanac assumes. Coordinates are the city centre.
 */
export interface City {
  key: string;
  name: string;
  lat: number;
  lon: number;
}

export const CITIES = [
  { key: 'agra', name: 'Agra', lat: 27.18, lon: 78.01 },
  { key: 'ahmedabad', name: 'Ahmedabad', lat: 23.02, lon: 72.57 },
  { key: 'amritsar', name: 'Amritsar', lat: 31.63, lon: 74.87 },
  { key: 'bengaluru', name: 'Bengaluru', lat: 12.97, lon: 77.59 },
  { key: 'bhopal', name: 'Bhopal', lat: 23.26, lon: 77.41 },
  { key: 'bhubaneswar', name: 'Bhubaneswar', lat: 20.3, lon: 85.82 },
  { key: 'chandigarh', name: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { key: 'chennai', name: 'Chennai', lat: 13.08, lon: 80.27 },
  { key: 'coimbatore', name: 'Coimbatore', lat: 11.02, lon: 76.96 },
  { key: 'dehradun', name: 'Dehradun', lat: 30.32, lon: 78.03 },
  { key: 'delhi', name: 'Delhi', lat: 28.61, lon: 77.21 },
  { key: 'guwahati', name: 'Guwahati', lat: 26.14, lon: 91.74 },
  { key: 'hyderabad', name: 'Hyderabad', lat: 17.39, lon: 78.49 },
  { key: 'indore', name: 'Indore', lat: 22.72, lon: 75.86 },
  { key: 'jaipur', name: 'Jaipur', lat: 26.91, lon: 75.79 },
  { key: 'kanpur', name: 'Kanpur', lat: 26.45, lon: 80.33 },
  { key: 'kochi', name: 'Kochi', lat: 9.93, lon: 76.27 },
  { key: 'kolkata', name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { key: 'kozhikode', name: 'Kozhikode', lat: 11.26, lon: 75.78 },
  { key: 'lucknow', name: 'Lucknow', lat: 26.85, lon: 80.95 },
  { key: 'madurai', name: 'Madurai', lat: 9.93, lon: 78.12 },
  { key: 'mumbai', name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { key: 'mysuru', name: 'Mysuru', lat: 12.3, lon: 76.64 },
  { key: 'nagpur', name: 'Nagpur', lat: 21.15, lon: 79.09 },
  { key: 'patna', name: 'Patna', lat: 25.59, lon: 85.14 },
  { key: 'pune', name: 'Pune', lat: 18.52, lon: 73.86 },
  { key: 'raipur', name: 'Raipur', lat: 21.25, lon: 81.63 },
  { key: 'ranchi', name: 'Ranchi', lat: 23.34, lon: 85.31 },
  { key: 'srinagar', name: 'Srinagar', lat: 34.08, lon: 74.8 },
  { key: 'surat', name: 'Surat', lat: 21.17, lon: 72.83 },
  { key: 'thiruvananthapuram', name: 'Thiruvananthapuram', lat: 8.52, lon: 76.94 },
  { key: 'varanasi', name: 'Varanasi', lat: 25.32, lon: 82.97 },
  { key: 'vijayawada', name: 'Vijayawada', lat: 16.51, lon: 80.65 },
  { key: 'visakhapatnam', name: 'Visakhapatnam', lat: 17.69, lon: 83.22 },
] as const satisfies readonly City[];

export type CityKey = (typeof CITIES)[number]['key'];

export const CITY_KEYS = CITIES.map((city) => city.key) as [CityKey, ...CityKey[]];

export const DEFAULT_CITY: CityKey = 'delhi';

export function cityFor(key: string | null | undefined): City {
  return CITIES.find((city) => city.key === key) ?? CITIES.find((city) => city.key === DEFAULT_CITY)!;
}
