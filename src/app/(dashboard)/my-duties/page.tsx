import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-guards";
import { getMyDuties } from "@/lib/scheduling/queries";
import { formatFridayDate } from "@/lib/format";
import { MarkUnavailableDialog } from "@/components/schedule/mark-unavailable-dialog";
import type { DutyType } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const DUTY_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "🏢 Room Booking",
  KHATIB: "🎤 Khatib",
  IMAM: "🕌 Imam",
};

export default async function MyDutiesPage() {
  const user = await requireUser();
  const duties = await getMyDuties(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Upcoming Duties</h1>
      {duties.length === 0 ? (
        <p className="text-muted-foreground">
          You have no upcoming duties assigned.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {duties.map((duty) => (
            <Card key={duty.id}>
              <CardHeader>
                <CardTitle>{DUTY_LABELS[duty.dutyType]}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {formatFridayDate(duty.schedule.date)}
                </p>
                <Badge variant={duty.status === "CONFIRMED" ? "default" : "secondary"}>
                  {duty.status === "CONFIRMED" ? "Confirmed" : "Assigned"}
                </Badge>
                <MarkUnavailableDialog
                  assignmentId={duty.id}
                  dutyLabel={DUTY_LABELS[duty.dutyType]}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
