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

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "destructive",
  RESOLVED: "default",
  CANCELLED: "outline",
};

export default async function AdminUnavailabilityPage() {
  const requests = await prisma.unavailabilityRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } }, schedule: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Unavailability History</h1>
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
              <TableCell>{r.dutyType}</TableCell>
              <TableCell className="text-muted-foreground">{r.reason}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
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
