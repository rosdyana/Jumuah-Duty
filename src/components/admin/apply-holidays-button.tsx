"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatFridayDate } from "@/lib/format";
import { applyHolidaysToSchedule } from "@/server/actions/holidays";
import { toast } from "sonner";

export function ApplyHolidaysButton({
  matchedDates,
  affectedAssignmentCount,
}: {
  matchedDates: Date[];
  affectedAssignmentCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    startTransition(async () => {
      try {
        const result = await applyHolidaysToSchedule();
        toast.success(
          `Cancelled ${result.cancelledSchedules} schedule(s), emailed ${result.emailsSent} assignee(s)` +
            (result.emailsFailed > 0 ? `, ${result.emailsFailed} email(s) failed` : "")
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (matchedDates.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled>
          Apply to Current Schedule
        </Button>
        <span className="text-xs text-muted-foreground">
          Nothing to apply — no upcoming schedules match the whitelist
        </span>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Apply to Current Schedule
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {matchedDates.length} schedule(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            This cancels the schedule{matchedDates.length > 1 ? "s" : ""} for{" "}
            {matchedDates.map(formatFridayDate).join(", ")} and emails all{" "}
            {affectedAssignmentCount} affected assignee(s) that their duty has been
            cancelled. Removing a date from the whitelist later won&apos;t undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleApply}
          >
            Apply
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
