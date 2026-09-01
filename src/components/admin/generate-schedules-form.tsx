"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateSchedules } from "@/server/actions/schedules";
import { toast } from "sonner";

export function GenerateSchedulesForm() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!startDate || !endDate) {
      toast.error("Pick both a start and end date");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date");
      return;
    }

    startTransition(async () => {
      try {
        const results = await generateSchedules({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
        if (results.length === 0) {
          toast.info("No Fridays in that range");
          return;
        }
        const created = results.filter((r) => r.status === "CREATED").length;
        const skipped = results.length - created;
        toast.success(
          `Generated ${created} schedule(s)` +
            (skipped > 0 ? `, skipped ${skipped} already-generated` : "")
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gen-start">Start date</Label>
        <Input
          id="gen-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gen-end">End date</Label>
        <Input
          id="gen-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <Button onClick={handleGenerate} disabled={isPending}>
        Generate
      </Button>
    </div>
  );
}
