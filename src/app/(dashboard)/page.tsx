import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getNearestUpcomingSchedule } from "@/lib/scheduling/queries";
import { formatFridayDate } from "@/lib/format";
import type { DutyType } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const DUTY_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "🏢 Room Booking",
  KHATIB: "🎤 Khatib",
  IMAM: "🕌 Imam",
};
const DUTY_ORDER: DutyType[] = ["ROOM_BOOKING", "KHATIB", "IMAM"];

export default async function DashboardPage() {
  const schedule = await getNearestUpcomingSchedule();

  if (!schedule) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">🕌 Jumuah Prayer</h1>
        <p className="text-muted-foreground">
          No upcoming schedule yet. An admin needs to generate one.
        </p>
      </div>
    );
  }

  const needsReplacement = schedule.assignments.filter(
    (a) => a.status === "REPLACEMENT_NEEDED"
  );
  const byDuty = new Map(schedule.assignments.map((a) => [a.dutyType, a]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        🕌 Jumuah Prayer — {formatFridayDate(schedule.date)}
      </h1>

      {needsReplacement.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>⚠️ Replacement Needed</AlertTitle>
          <AlertDescription>
            {needsReplacement
              .map((a) => DUTY_LABELS[a.dutyType] ?? a.dutyType)
              .join(", ")}{" "}
            — no replacement assigned yet.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {DUTY_ORDER.map((dutyType) => {
          const assignment = byDuty.get(dutyType);
          return (
            <Card key={dutyType}>
              <CardHeader>
                <CardTitle>{DUTY_LABELS[dutyType]}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-lg">
                  {assignment?.assignedUser?.name ?? "—"}
                </span>
                {assignment?.status === "REPLACEMENT_NEEDED" && (
                  <Badge variant="destructive">Needs replacement</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
