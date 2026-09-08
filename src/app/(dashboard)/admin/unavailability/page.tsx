import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatFridayDate } from "@/lib/format";
import {
  UNAVAILABILITY_STATUS_LABELS,
  UNAVAILABILITY_STATUS_VARIANT,
} from "@/lib/status-labels";
import { DUTY_LABELS } from "@/lib/duty-labels";

export const dynamic = "force-dynamic";

export default async function AdminUnavailabilityPage() {
  const requests = await prisma.unavailabilityRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } }, schedule: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Unavailability History</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Duty</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.user.name}</TableCell>
              <TableCell>{formatFridayDate(r.schedule.date)}</TableCell>
              <TableCell>{DUTY_LABELS[r.dutyType]}</TableCell>
              <TableCell className="text-muted-foreground">{r.reason}</TableCell>
              <TableCell>
                <Badge variant={UNAVAILABILITY_STATUS_VARIANT[r.status] ?? "outline"}>
                  {UNAVAILABILITY_STATUS_LABELS[r.status] ?? r.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No unavailability requests yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
