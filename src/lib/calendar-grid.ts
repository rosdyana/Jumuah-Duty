import { addDays } from "@/lib/scheduling/fridays";

/**
 * Every UTC-midnight date-only Day needed to render a full Sun-Sat month grid for
 * `year`/`monthIndex0` (0-based month), including leading/trailing days from the
 * adjacent months so every week row is complete.
 */
export function getMonthGridDays(year: number, monthIndex0: number): Date[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex0, 1));
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getUTCDay());

  const lastOfMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  const gridEnd = addDays(lastOfMonth, 6 - lastOfMonth.getUTCDay());

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}
