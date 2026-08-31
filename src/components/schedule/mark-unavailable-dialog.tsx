"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { markUnavailable } from "@/server/actions/unavailability";
import { toast } from "sonner";

export function MarkUnavailableDialog({
  assignmentId,
  dutyLabel,
}: {
  assignmentId: string;
  dutyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await markUnavailable({ assignmentId, reason });
        toast.success("Marked unavailable — this duty now needs a replacement.");
        setOpen(false);
        setReason("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        I&apos;m Unavailable
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark unavailable — {dutyLabel}</DialogTitle>
          <DialogDescription>
            This opens a replacement request for this duty. Please provide a short
            reason.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Annual Leave"
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || reason.trim().length < 3}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
