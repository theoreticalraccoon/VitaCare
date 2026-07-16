/** Date/time helpers. All "time" strings are 24-hour "HH:MM". */

/** Grace window (minutes) after the scheduled time before a dose is "late". */
export const GRACE_MINUTES = 15;
/** Minutes after the scheduled time after which an unconfirmed dose is "missed". */
export const MISSED_MINUTES = 120;

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Minutes since midnight for a "HH:MM" string. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Current minutes since midnight. */
export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** "08:00" -> "8:00 AM" */
export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** ISO timestamp -> "8:15 AM" */
export function formatTimestamp12(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

/** ISO timestamp -> "Wednesday" */
export function weekdayName(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long' });
}

/** Whole minutes between two minute-of-day values (b - a). */
export function minutesBetween(a: number, b: number): number {
  return b - a;
}

/** Validates a "HH:MM" 24-hour string. */
export function isValidTime(time: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(time.trim());
}

/** Normalises loose input like "8:0" or "8" into "08:00" where possible. */
export function normalizeTime(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = match[2] ? Number(match[2]) : 0;
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
