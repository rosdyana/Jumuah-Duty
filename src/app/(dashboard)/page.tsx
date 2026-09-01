import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { getNearestUpcomingSchedule, getSchedulesInRange } from "@/lib/scheduling/queries";
import { todayDateOnly } from "@/lib/scheduling/fridays";
import { getMonthGridDays } from "@/lib/calendar-grid";
import { formatFridayDate } from "@/lib/format";
import { DUTY_LABELS } from "@/lib/duty-labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = todayDateOnly();
  const monthDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const days = getMonthGridDays(today.getUTCFullYear(), today.getUTCMonth());
  const [nearestSchedule, schedules] = await Promise.all([
    getNearestUpcomingSchedule(),
    getSchedulesInRange(days[0], days[days.length - 1]),
  ]);

  const needsReplacement = nearestSchedule?.assignments.filter(
    (a) => a.status === "REPLACEMENT_NEEDED"
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🕌 Jumuah Prayer</h1>

      {needsReplacement && needsReplacement.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>⚠️ Replacement Needed</AlertTitle>
          <AlertDescription>
            {formatFridayDate(nearestSchedule!.date)} —{" "}
            {needsReplacement
              .map((a) => DUTY_LABELS[a.dutyType] ?? a.dutyType)
              .join(", ")}{" "}
            — no replacement assigned yet.
          </AlertDescription>
        </Alert>
      )}

      <ScheduleCalendar monthDate={monthDate} days={days} schedules={schedules} />

      {schedules.length === 0 && (
        <p className="text-muted-foreground">
          No schedule generated for this month yet. An admin needs to generate one.
        </p>
      )}
    </div>
  );
}
