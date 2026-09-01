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
import { clearUpcomingSchedules } from "@/server/actions/schedules";
import { toast } from "sonner";

export function ClearSchedulesButton() {
  const [isPending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      try {
        const count = await clearUpcomingSchedules();
        toast.success(`Cleared ${count} upcoming schedule(s)`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Clear All Upcoming
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all upcoming schedules?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes every upcoming schedule and its assignments (e.g. for a national
            holiday). Historical/completed schedules are kept, but rotation order won&apos;t
            be rewound. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleClear}>
            Clear All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
