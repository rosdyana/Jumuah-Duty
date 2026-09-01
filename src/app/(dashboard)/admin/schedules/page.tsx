import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatFridayDate } from "@/lib/format";
import { GenerateSchedulesForm } from "@/components/admin/generate-schedules-form";
import { ClearSchedulesButton } from "@/components/admin/clear-schedules-button";
import { DeleteScheduleButton } from "@/components/admin/delete-schedule-button";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: { assignments: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Schedule Generation</h1>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <GenerateSchedulesForm />
        <ClearSchedulesButton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Needs Replacement</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const needsReplacement = schedule.assignments.some(
              (a) => a.status === "REPLACEMENT_NEEDED"
            );
            return (
              <TableRow key={schedule.id}>
                <TableCell>{formatFridayDate(schedule.date)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{schedule.status}</Badge>
                </TableCell>
                <TableCell>
                  {needsReplacement && <Badge variant="destructive">Yes</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" render={<Link href={`/admin/schedules/${schedule.id}`} />}>
                      Manage
                    </Button>
                    <DeleteScheduleButton scheduleId={schedule.id} date={schedule.date} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
