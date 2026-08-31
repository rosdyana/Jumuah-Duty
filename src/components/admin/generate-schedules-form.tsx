"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateSchedules } from "@/server/actions/schedules";
import { toast } from "sonner";

export function GenerateSchedulesForm() {
  const [count, setCount] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const results = await generateSchedules({
          count,
          startDate: startDate ? new Date(startDate) : undefined,
        });
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
        <Label htmlFor="gen-count">Number of Fridays</Label>
        <Input
          id="gen-count"
          type="number"
          min={1}
          max={12}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-32"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gen-start">Start date (optional)</Label>
        <Input
          id="gen-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <Button onClick={handleGenerate} disabled={isPending}>
        Generate
      </Button>
    </div>
  );
}
