import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { getSchedulesInRange } from "@/lib/scheduling/queries";
import { todayDateOnly } from "@/lib/scheduling/fridays";
import { getMonthGridDays } from "@/lib/calendar-grid";

export const dynamic = "force-dynamic";

const MONTH_HEADING_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function parseMonthParam(value: string | undefined): { year: number; monthIndex0: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return { year: Number(match[1]), monthIndex0: Number(match[2]) - 1 };
  }
  const today = todayDateOnly();
  return { year: today.getUTCFullYear(), monthIndex0: today.getUTCMonth() };
}

function shiftMonth(
  year: number,
  monthIndex0: number,
  delta: number
): { year: number; monthIndex0: number } {
  const shifted = new Date(Date.UTC(year, monthIndex0 + delta, 1));
  return { year: shifted.getUTCFullYear(), monthIndex0: shifted.getUTCMonth() };
}

function monthParam(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export default async function UpcomingSchedulePage(props: PageProps<"/upcoming">) {
  const searchParams = await props.searchParams;
  const monthValue = Array.isArray(searchParams.month)
    ? searchParams.month[0]
    : searchParams.month;
  const { year, monthIndex0 } = parseMonthParam(monthValue);

  const monthDate = new Date(Date.UTC(year, monthIndex0, 1));
  const days = getMonthGridDays(year, monthIndex0);
  const schedules = await getSchedulesInRange(days[0], days[days.length - 1]);

  const prev = shiftMonth(year, monthIndex0, -1);
  const next = shiftMonth(year, monthIndex0, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Upcoming Schedule</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/upcoming?month=${monthParam(prev.year, prev.monthIndex0)}`} />}
          >
            ← Prev
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            {MONTH_HEADING_FORMATTER.format(monthDate)}
          </span>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/upcoming?month=${monthParam(next.year, next.monthIndex0)}`} />}
          >
            Next →
          </Button>
        </div>
      </div>
      <ScheduleCalendar monthDate={monthDate} days={days} schedules={schedules} />
    </div>
  );
}
