export function nowIso(): string {
  return new Date().toISOString();
}

export function isoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function parseDate(value: string | Date | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysSince(value: string | Date, now: Date = new Date()): number {
  const date = parseDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export function isRecent(
  value: string | Date | undefined,
  days: number,
  now = new Date(),
): boolean {
  if (!value) return false;
  return daysSince(value, now) <= days;
}

/** ISO week label, e.g. 2026-W45. */
export function isoWeek(value: string | Date): string {
  const date = parseDate(value) ?? new Date();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function formatDate(value: string | Date | undefined): string {
  const date = parseDate(value);
  if (!date) return "unknown";
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string | Date, days: number): Date {
  const date = parseDate(value) ?? new Date();
  return new Date(date.getTime() + days * 86_400_000);
}
