const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date-only value (UTC-midnight Date) without shifting to local timezone. */
export function formatFridayDate(date: Date): string {
  return formatter.format(date);
}
