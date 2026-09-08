import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getReplacementNeeded } from "@/lib/scheduling/queries";
import { formatFridayDate } from "@/lib/format";
import { TakeReplacementButton } from "@/components/schedule/take-replacement-button";
import { DUTY_ICONS, DUTY_LABELS } from "@/lib/duty-labels";

export const dynamic = "force-dynamic";

const CAPABILITY_BY_DUTY = {
  ROOM_BOOKING: "canBookRoom",
  KHATIB: "canBeKhatib",
  IMAM: "canBeImam",
} as const;

export default async function ReplacementBoardPage() {
  const user = await requireUser();
  const [assignments, ownUnavailability] = await Promise.all([
    getReplacementNeeded(),
    prisma.unavailabilityRequest.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { scheduleId: true, dutyType: true },
    }),
  ]);

  const ownUnavailableSlots = new Set(
    ownUnavailability.map((r) => `${r.scheduleId}:${r.dutyType}`)
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Replacement Needed</h1>
      {assignments.length === 0 ? (
        <p className="text-muted-foreground">
          Nothing needs a replacement right now.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Duty</TableHead>
              <TableHead>Original Member</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => {
              const canTake =
                user[CAPABILITY_BY_DUTY[a.dutyType]] &&
                !ownUnavailableSlots.has(`${a.scheduleId}:${a.dutyType}`);
              const DutyIcon = DUTY_ICONS[a.dutyType];
              return (
                <TableRow key={a.id}>
                  <TableCell>{formatFridayDate(a.schedule.date)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <DutyIcon className="size-3.5 text-primary" />
                      {DUTY_LABELS[a.dutyType]}
                    </span>
                  </TableCell>
                  <TableCell>{a.originalUser?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.reason ?? "—"}
                  </TableCell>
                  <TableCell>
                    {canTake && (
                      <TakeReplacementButton
                        assignmentId={a.id}
                        dutyLabel={DUTY_LABELS[a.dutyType]}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
