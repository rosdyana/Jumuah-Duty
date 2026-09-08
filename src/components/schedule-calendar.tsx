"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isFriday, todayDateOnly } from "@/lib/scheduling/fridays";
import { formatFridayDate } from "@/lib/format";
import { DUTY_ICONS, DUTY_LABELS, DUTY_ORDER } from "@/lib/duty-labels";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/status-labels";
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
  const todayKey = dateKey(todayDateOnly());

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
          const isToday = dateKey(day) === todayKey;
          const schedule = scheduleByDate.get(dateKey(day));
          const byDuty = new Map(schedule?.assignments.map((a) => [a.dutyType, a]) ?? []);
          const needsReplacement = schedule?.assignments.some(
            (a) => a.status === "REPLACEMENT_NEEDED"
          );

          return (
            <div
              key={dateKey(day)}
              className={cn(
                "min-h-24 rounded-md border p-1.5 text-xs transition-colors sm:min-h-28 sm:p-2 lg:min-h-32",
                !isCurrentMonth && "opacity-40",
                !friday && "bg-muted/30 text-muted-foreground",
                isToday && "border-primary/60 ring-1 ring-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono font-medium tabular-nums",
                    isToday &&
                      "flex size-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                  )}
                >
                  {day.getUTCDate()}
                </span>
                {friday && needsReplacement && (
                  <Badge variant="destructive" className="h-4 px-1 text-2xs">
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
                      const DutyIcon = DUTY_ICONS[duty];
                      return (
                        <div key={duty} className="flex items-center gap-1.5 truncate">
                          <DutyIcon className="size-3 shrink-0 text-primary" />
                          <span className="truncate">
                            {assignment?.assignedUser?.name ?? "—"}
                          </span>
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
                        const DutyIcon = DUTY_ICONS[duty];
                        return (
                          <div key={duty} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <DutyIcon className="size-4 text-primary" />
                              {DUTY_LABELS[duty]}
                            </span>
                            <span className="flex items-center gap-2 text-right">
                              {assignment?.assignedUser?.name ?? "—"}
                              {assignment?.status === "REPLACEMENT_NEEDED" && (
                                <Badge variant="destructive">
                                  {ASSIGNMENT_STATUS_LABELS.REPLACEMENT_NEEDED}
                                </Badge>
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
