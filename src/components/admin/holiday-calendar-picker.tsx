"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMonthGridDays } from "@/lib/calendar-grid";
import { dateKey, isFriday, todayDateOnly } from "@/lib/scheduling/fridays";
import { addHolidaysSchema } from "@/lib/validation/schemas";
import { addHolidays } from "@/server/actions/holidays";
import { toast } from "sonner";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_HEADING_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function shiftMonth(
  year: number,
  monthIndex0: number,
  delta: number
): { year: number; monthIndex0: number } {
  const shifted = new Date(Date.UTC(year, monthIndex0 + delta, 1));
  return { year: shifted.getUTCFullYear(), monthIndex0: shifted.getUTCMonth() };
}

export function HolidayCalendarPicker({
  existingHolidayDateKeys,
}: {
  existingHolidayDateKeys: string[];
}) {
  const today = todayDateOnly();
  const [monthState, setMonthState] = useState({
    year: today.getUTCFullYear(),
    monthIndex0: today.getUTCMonth(),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingSet = useMemo(
    () => new Set(existingHolidayDateKeys),
    [existingHolidayDateKeys]
  );
  const days = useMemo(
    () => getMonthGridDays(monthState.year, monthState.monthIndex0),
    [monthState]
  );
  const monthDate = new Date(Date.UTC(monthState.year, monthState.monthIndex0, 1));
  const sortedSelected = [...selected].sort();

  function toggleDay(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleSave() {
    const dates = sortedSelected.map((key) => new Date(`${key}T00:00:00.000Z`));
    const parsed = addHolidaysSchema.safeParse({
      dates,
      reason: reason.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid selection");
      return;
    }
    startTransition(async () => {
      try {
        const result = await addHolidays(parsed.data);
        toast.success(
          `Added ${result.created} date(s) to the whitelist` +
            (result.skipped > 0 ? `, ${result.skipped} already whitelisted` : "")
        );
        setSelected(new Set());
        setReason("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setMonthState((s) => shiftMonth(s.year, s.monthIndex0, -1))
            }
          >
            ← Prev
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            {MONTH_HEADING_FORMATTER.format(monthDate)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setMonthState((s) => shiftMonth(s.year, s.monthIndex0, 1))
            }
          >
            Next →
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Only Fridays can be whitelisted.
        </p>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = dateKey(day);
            const isCurrentMonth =
              day.getUTCFullYear() === monthState.year &&
              day.getUTCMonth() === monthState.monthIndex0;
            const friday = isFriday(day);
            const alreadyWhitelisted = existingSet.has(key);
            const isSelected = selected.has(key);

            return (
              <button
                key={key}
                type="button"
                disabled={!friday || alreadyWhitelisted}
                onClick={() => toggleDay(key)}
                title={alreadyWhitelisted ? "Already whitelisted" : undefined}
                className={cn(
                  "min-h-12 rounded-md border p-1 font-mono text-xs tabular-nums transition-colors",
                  !isCurrentMonth && "opacity-40",
                  !friday && "cursor-not-allowed bg-muted/30 text-muted-foreground",
                  friday &&
                    !alreadyWhitelisted &&
                    !isSelected &&
                    "hover:bg-muted",
                  alreadyWhitelisted &&
                    "cursor-not-allowed bg-secondary text-secondary-foreground",
                  isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {day.getUTCDate()}
              </button>
            );
          })}
        </div>
      </div>

      {sortedSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedSelected.map((key) => (
            <Badge key={key} variant="secondary" className="gap-1">
              {key}
              <button
                type="button"
                onClick={() => toggleDay(key)}
                className="ml-0.5 opacity-70 hover:opacity-100"
                aria-label={`Remove ${key} from selection`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <Label htmlFor="holiday-reason">Reason (optional)</Label>
          <Input
            id="holiday-reason"
            placeholder="e.g. Eid al-Fitr"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={isPending || selected.size === 0}>
          Save to Whitelist
        </Button>
      </div>
    </div>
  );
}
