"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { takeReplacement } from "@/server/actions/replacement";
import { toast } from "sonner";

export function TakeReplacementButton({
  assignmentId,
  dutyLabel,
}: {
  assignmentId: string;
  dutyLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await takeReplacement({ assignmentId });
        toast.success(`You're now assigned as ${dutyLabel}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" />}>
        Take This Duty
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Take this duty?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll be assigned as {dutyLabel} for this Friday.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
