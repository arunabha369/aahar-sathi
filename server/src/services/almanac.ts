/**
 * Sun and moon positions for fasting times — sehri and iftar in Ramadan, and which days are
 * Ekadashi. Formulae are from Jean Meeus, "Astronomical Algorithms" (2nd ed.): the sun to
 * about 0.01°, the moon from the main terms of chapter 47 to a few hundredths of a degree,
 * which puts calculated times within a minute or two of published timetables.
 *
 * Everything is for India: dates and clock times are Indian Standard Time (UTC+5:30).
 */
import type { City } from '../data/cities.ts';

const IST_OFFSET_MINUTES = 330;
const DEG = Math.PI / 180;
const sin = (degrees: number) => Math.sin(degrees * DEG);
const cos = (degrees: number) => Math.cos(degrees * DEG);
const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;

/** Terrestrial minus universal time (ΔT), about 69 s through the 2020s. */
const DELTA_T_MS = 69_000;

/** Julian centuries since J2000.0 (in terrestrial time) for a moment in universal time. */
function centuries(ms: number): number {
  return ((ms + DELTA_T_MS) / 86_400_000 + 2440587.5 - 2451545) / 36525;
}

/** Longitude of the moon's ascending node, which drives nutation. */
const nodeLongitude = (t: number) => 125.04 - 1934.136 * t;

interface SunPosition {
  /** Apparent ecliptic longitude, degrees. */
  longitude: number;
  declination: number;
  /** Equation of time, minutes. */
  equationOfTime: number;
}

/** Meeus chapter 25 (low accuracy) and the NOAA equation of time. */
function sunPosition(ms: number): SunPosition {
  const t = centuries(ms);
  const meanLongitude = normalize(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
  const meanAnomaly = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const eccentricity = 0.016708634 - 0.000042037 * t;
  const centre =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * sin(meanAnomaly) +
    (0.019993 - 0.000101 * t) * sin(2 * meanAnomaly) +
    0.000289 * sin(3 * meanAnomaly);
  const omega = nodeLongitude(t);
  const longitude = meanLongitude + centre - 0.00569 - 0.00478 * sin(omega);
  const obliquity = 23.439291 - 0.0130042 * t + 0.00256 * cos(omega);
  const declination = Math.asin(sin(obliquity) * sin(longitude)) / DEG;

  const y = Math.tan((obliquity / 2) * DEG) ** 2;
  const equation =
    y * sin(2 * meanLongitude) -
    2 * eccentricity * sin(meanAnomaly) +
    4 * eccentricity * y * sin(meanAnomaly) * cos(2 * meanLongitude) -
    0.5 * y * y * sin(4 * meanLongitude) -
    1.25 * eccentricity * eccentricity * sin(2 * meanAnomaly);

  return { longitude: normalize(longitude), declination, equationOfTime: (4 * equation) / DEG };
}

/** Periodic terms for the moon's longitude (Meeus table 47.A): D, M, M′, F, coefficient in 1e-6°. */
const MOON_TERMS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
  [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236],
  [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700],
  [2, 1, -2, 0, 691], [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399], [0, 0, 2, -2, -381],
  [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330], [2, -1, 2, 0, 327],
  [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294],
];

/** Apparent geocentric longitude of the moon, degrees (Meeus chapter 47). */
export function moonLongitude(ms: number): number {
  const t = centuries(ms);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const meanLongitude = 218.3164477 + 481267.88123421 * t - 0.0015786 * t2 + t3 / 538841 - t4 / 65194000;
  const elongation = 297.8501921 + 445267.1114034 * t - 0.0018819 * t2 + t3 / 545868 - t4 / 113065000;
  const sunAnomaly = 357.5291092 + 35999.0502909 * t - 0.0001536 * t2 + t3 / 24490000;
  const moonAnomaly = 134.9633964 + 477198.8675055 * t + 0.0087414 * t2 + t3 / 69699 - t4 / 14712000;
  const latitudeArgument = 93.272095 + 483202.0175233 * t - 0.0036539 * t2 - t3 / 3526000 + t4 / 863310000;
  const e = 1 - 0.002516 * t - 0.0000074 * t2;

  let sum = 0;
  for (const [d, m, mPrime, f, coefficient] of MOON_TERMS) {
    const scale = Math.abs(m) === 1 ? e : Math.abs(m) === 2 ? e * e : 1;
    sum += coefficient * scale * sin(d * elongation + m * sunAnomaly + mPrime * moonAnomaly + f * latitudeArgument);
  }
  const a1 = 119.75 + 131.849 * t;
  const a2 = 53.09 + 479264.29 * t;
  sum += 3958 * sin(a1) + 1962 * sin(meanLongitude - latitudeArgument) + 318 * sin(a2);

  // Nutation in longitude, so the moon is on the same footing as the apparent sun.
  return normalize(meanLongitude + sum / 1e6 - 0.00478 * sin(nodeLongitude(t)));
}

/** How far the moon is ahead of the sun, 0–360°. New moon is 0°, full moon 180°. */
export function lunarElongation(ms: number): number {
  return normalize(moonLongitude(ms) - sunPosition(ms).longitude);
}

/** The lunar day (1–30) in force at a moment: 1–15 is the bright half (Shukla), 16–30 the dark (Krishna). */
export function tithiAt(ms: number): number {
  return Math.floor(lunarElongation(ms) / 12) + 1;
}

/** Midnight IST at the start of an ISO date, as UTC milliseconds. */
function istMidnight(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) - IST_OFFSET_MINUTES * 60_000;
}

/**
 * The moment (UTC ms) on an IST date when the sun's centre reaches `altitude` degrees, in
 * the morning or the evening; null if it never does (not a concern at Indian latitudes).
 */
export function sunAltitudeTime(date: string, city: City, altitude: number, when: 'morning' | 'evening'): number | null {
  const midnight = istMidnight(date);
  // Start from local solar noon and refine twice with the sun's position at the event itself.
  let estimate = midnight + (IST_OFFSET_MINUTES + 720 - 4 * city.lon) * 60_000;
  for (let pass = 0; pass < 3; pass += 1) {
    const sun = sunPosition(estimate);
    const cosHourAngle =
      (sin(altitude) - sin(city.lat) * sin(sun.declination)) / (cos(city.lat) * cos(sun.declination));
    if (cosHourAngle < -1 || cosHourAngle > 1) return null;
    const hourAngle = Math.acos(cosHourAngle) / DEG;
    const noonUtcMinutes = 720 - 4 * city.lon - sun.equationOfTime;
    const eventUtcMinutes = noonUtcMinutes + (when === 'morning' ? -4 : 4) * hourAngle;
    estimate = Date.parse(`${date}T00:00:00Z`) + eventUtcMinutes * 60_000;
    // The UTC day that holds this IST date's event can be the previous one (early IST mornings).
    if (estimate < midnight) estimate += 86_400_000;
    if (estimate >= midnight + 86_400_000) estimate -= 86_400_000;
  }
  return estimate;
}

/** Standard refraction and the sun's radius put sunrise and sunset at −0.833°. */
const SUNRISE_ALTITUDE = -0.833;
/** Fajr (the end of sehri) at 18° below the horizon — the University of Islamic Sciences, Karachi method used across India. */
const FAJR_ALTITUDE = -18;

/** "HH:MM" on the 24-hour clock in IST. */
export function istClock(ms: number): string {
  const minutes = Math.floor((ms / 60_000 + IST_OFFSET_MINUTES) % 1440 + 1440) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export interface RamadanTimes {
  date: string;
  /** Sehri must be finished by Fajr. */
  sehriEnds: string;
  /** Iftar is at sunset (Maghrib). */
  iftar: string;
}

export function ramadanTimes(date: string, city: City): RamadanTimes {
  const fajr = sunAltitudeTime(date, city, FAJR_ALTITUDE, 'morning');
  const sunset = sunAltitudeTime(date, city, SUNRISE_ALTITUDE, 'evening');
  if (fajr === null || sunset === null) throw new Error(`No sun times for ${city.name} on ${date}.`);
  // Round Fajr down and sunset up, so the times shown are never the wrong side of the real ones.
  return {
    date,
    sehriEnds: istClock(Math.floor(fajr / 60_000) * 60_000),
    iftar: istClock(Math.ceil(sunset / 60_000) * 60_000),
  };
}

export function sunrise(date: string, city: City): number {
  const time = sunAltitudeTime(date, city, SUNRISE_ALTITUDE, 'morning');
  if (time === null) throw new Error(`No sunrise for ${city.name} on ${date}.`);
  return time;
}

export function addDays(date: string, days: number): string {
  const moment = new Date(`${date}T00:00:00Z`);
  moment.setUTCDate(moment.getUTCDate() + days);
  return moment.toISOString().slice(0, 10);
}

/** Today's date in India. */
export function todayInIndia(now = Date.now()): string {
  return new Date(now + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

const SHUKLA_EKADASHI = 11;
const KRISHNA_EKADASHI = 26;
const isEkadashi = (tithi: number) => tithi === SHUKLA_EKADASHI || tithi === KRISHNA_EKADASHI;

export interface EkadashiDay {
  date: string;
  paksha: 'shukla' | 'krishna';
}

/**
 * Ekadashi fast days from `from` for `days` days, by the common (Smarta) rule: the day whose
 * sunrise falls in the eleventh tithi. When one Ekadashi spans two sunrises the first day is
 * kept; when it starts after one sunrise and ends before the next, that day is kept.
 */
export function ekadashiDays(from: string, days: number, city: City): EkadashiDay[] {
  const result: EkadashiDay[] = [];
  // Look at the day before too, so an Ekadashi already under way is recognised as a repeat.
  let previous = tithiAt(sunrise(addDays(from, -1), city));
  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(from, offset);
    const tithi = tithiAt(sunrise(date, city));
    const nextTithi = tithiAt(sunrise(addDays(date, 1), city));
    const holdsEkadashi = isEkadashi(tithi) && tithi !== previous;
    // Kshaya: the tenth at this sunrise and the twelfth at the next — Ekadashi fell entirely within this day.
    const skipped = (tithi === SHUKLA_EKADASHI - 1 && nextTithi === SHUKLA_EKADASHI + 1) ||
      (tithi === KRISHNA_EKADASHI - 1 && nextTithi === KRISHNA_EKADASHI + 1);
    if (holdsEkadashi || skipped) {
      result.push({ date, paksha: (holdsEkadashi ? tithi : tithi + 1) <= 15 ? 'shukla' : 'krishna' });
    }
    previous = tithi;
  }
  return result;
}
