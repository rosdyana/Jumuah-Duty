"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatFridayDate } from "@/lib/format";
import { removeHoliday } from "@/server/actions/holidays";
import { toast } from "sonner";

export type HolidayRow = {
  id: string;
  date: Date;
  reason: string | null;
  createdBy: { name: string } | null;
  createdAt: Date;
};

export function HolidayList({ holidays }: { holidays: HolidayRow[] }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(holidayId: string) {
    startTransition(async () => {
      try {
        await removeHoliday({ holidayId });
        toast.success("Removed from whitelist");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (holidays.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No holiday dates whitelisted yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Added by</TableHead>
          <TableHead className="text-right">Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holidays.map((holiday) => (
          <TableRow key={holiday.id}>
            <TableCell className="font-medium">
              {formatFridayDate(holiday.date)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {holiday.reason || "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {holiday.createdBy?.name ?? "—"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleRemove(holiday.id)}
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
