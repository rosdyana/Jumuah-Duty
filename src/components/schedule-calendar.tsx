"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isFriday } from "@/lib/scheduling/fridays";
import { formatFridayDate } from "@/lib/format";
import { DUTY_LABELS, DUTY_ORDER, DUTY_SHORT_LABELS } from "@/lib/duty-labels";
import type { getSchedulesInRange } from "@/lib/scheduling/queries";

type ScheduleWithAssignments = Awaited<ReturnType<typeof getSchedulesInRange>>[number];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ScheduleCalendar({
  monthDate,
  days,
  schedules,
}: {
  monthDate: Date;
  days: Date[];
  schedules: ScheduleWithAssignments[];
}) {
  const scheduleByDate = new Map(schedules.map((s) => [dateKey(s.date), s]));

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth =
            day.getUTCFullYear() === monthDate.getUTCFullYear() &&
            day.getUTCMonth() === monthDate.getUTCMonth();
          const friday = isFriday(day);
          const schedule = scheduleByDate.get(dateKey(day));
          const byDuty = new Map(schedule?.assignments.map((a) => [a.dutyType, a]) ?? []);
          const needsReplacement = schedule?.assignments.some(
            (a) => a.status === "REPLACEMENT_NEEDED"
          );

          return (
            <div
              key={dateKey(day)}
              className={cn(
                "min-h-24 rounded-md border p-1.5 text-xs",
                !isCurrentMonth && "opacity-40",
                !friday && "bg-muted/30 text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{day.getUTCDate()}</span>
                {friday && needsReplacement && (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                    !
                  </Badge>
                )}
              </div>

              {friday && schedule && (
                <Dialog>
                  <DialogTrigger
                    render={
                      <button
                        type="button"
                        className="mt-1 w-full space-y-0.5 rounded bg-primary/10 p-1 text-left ring-1 ring-primary/30 hover:bg-primary/20"
                      />
                    }
                  >
                    {DUTY_ORDER.map((duty) => {
                      const assignment = byDuty.get(duty);
                      return (
                        <div key={duty} className="truncate">
                          {DUTY_SHORT_LABELS[duty]} {assignment?.assignedUser?.name ?? "—"}
                        </div>
                      );
                    })}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{formatFridayDate(schedule.date)}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {DUTY_ORDER.map((duty) => {
                        const assignment = byDuty.get(duty);
                        return (
                          <div key={duty} className="flex items-center justify-between gap-2">
                            <span>{DUTY_LABELS[duty]}</span>
                            <span className="flex items-center gap-2 text-right">
                              {assignment?.assignedUser?.name ?? "—"}
                              {assignment?.status === "REPLACEMENT_NEEDED" && (
                                <Badge variant="destructive">Needs replacement</Badge>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {friday && !schedule && (
                <div className="mt-1 rounded border border-dashed p-1 text-center text-muted-foreground">
                  Not scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
