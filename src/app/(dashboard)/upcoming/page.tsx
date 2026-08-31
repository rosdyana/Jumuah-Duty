import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUpcomingSchedules } from "@/lib/scheduling/queries";
import { formatFridayDate } from "@/lib/format";
import type { DutyType } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const DUTY_ORDER: DutyType[] = ["ROOM_BOOKING", "KHATIB", "IMAM"];
const DUTY_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "Room Booking",
  KHATIB: "Khatib",
  IMAM: "Imam",
};

export default async function UpcomingSchedulePage() {
  const schedules = await getUpcomingSchedules(8);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Upcoming Schedule</h1>
      {schedules.length === 0 ? (
        <p className="text-muted-foreground">No upcoming schedules yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {DUTY_ORDER.map((d) => (
                <TableHead key={d}>{DUTY_LABELS[d]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const byDuty = new Map(schedule.assignments.map((a) => [a.dutyType, a]));
              return (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {formatFridayDate(schedule.date)}
                  </TableCell>
                  {DUTY_ORDER.map((d) => {
                    const a = byDuty.get(d);
                    return (
                      <TableCell key={d}>
                        {a?.assignedUser?.name ?? (
                          <Badge variant="destructive">Needs replacement</Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
