/**
 * Date helpers treating "Friday" as a wall-clock concept in APP_TIMEZONE, not UTC.
 * All returned/accepted dates are "date-only": a UTC-midnight Date whose Y/M/D fields
 * represent a calendar day, matching the timezone-less `@db.Date` Prisma column. Once
 * constructed via `todayDateOnly`, arithmetic stays in UTC field math (`addDays`) and
 * never re-derives from a timezone again, so it's safe to use everywhere downstream.
 */

export const DEFAULT_APP_TIMEZONE = "Asia/Jakarta";

export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;
}

export function todayDateOnly(timeZone: string = appTimeZone(), now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(dateOnly: Date, days: number): Date {
  return new Date(
    Date.UTC(dateOnly.getUTCFullYear(), dateOnly.getUTCMonth(), dateOnly.getUTCDate() + days)
  );
}

export function isFriday(dateOnly: Date): boolean {
  return dateOnly.getUTCDay() === 5;
}

export function nextFridayOnOrAfter(dateOnly: Date): Date {
  const diff = (5 - dateOnly.getUTCDay() + 7) % 7;
  return addDays(dateOnly, diff);
}

/**
 * Next `count` Fridays starting from `startDateOnly` (defaults to the next upcoming
 * Friday on/after today). If `startDateOnly` isn't itself a Friday, it's rolled forward
 * to the next one — admin-facing UI should default its date picker to this same value
 * rather than hiding the rule entirely.
 */
export function getNextNFridays(count: number, startDateOnly?: Date): Date[] {
  const base = startDateOnly ?? todayDateOnly();
  const start = isFriday(base) ? base : nextFridayOnOrAfter(base);
  return Array.from({ length: count }, (_, i) => addDays(start, i * 7));
}
