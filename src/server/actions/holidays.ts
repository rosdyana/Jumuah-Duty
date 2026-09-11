"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { emailProvider } from "@/lib/email";
import { formatFridayDate } from "@/lib/format";
import { dateKey } from "@/lib/scheduling/fridays";
import { ScheduleCancelledEmail } from "@/lib/email/templates/schedule-cancelled";
import {
  addHolidaysSchema,
  removeHolidaySchema,
  type AddHolidaysInput,
} from "@/lib/validation/schemas";

export async function addHolidays(input: AddHolidaysInput) {
  const user = await requireAdmin();
  const { dates, reason } = addHolidaysSchema.parse(input);

  const { count } = await prisma.holiday.createMany({
    data: dates.map((date) => ({ date, reason, createdById: user.id })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/settings/holidays");

  return { created: count, skipped: dates.length - count };
}

export async function removeHoliday(input: { holidayId: string }) {
  await requireAdmin();
  const { holidayId } = removeHolidaySchema.parse(input);

  // Intentionally does not touch Schedule/ScheduleAssignment — removing a whitelist
  // entry only stops it from blocking future generation, it never restores a
  // schedule already cancelled via applyHolidaysToSchedule.
  await prisma.holiday.delete({ where: { id: holidayId } });

  revalidatePath("/admin/settings/holidays");
}

export async function applyHolidaysToSchedule() {
  await requireAdmin();

  const holidays = await prisma.holiday.findMany({ select: { date: true, reason: true } });
  if (holidays.length === 0) {
    return { cancelledSchedules: 0, cancelledAssignments: 0, emailsSent: 0, emailsFailed: 0 };
  }
  const reasonByDateKey = new Map(holidays.map((h) => [dateKey(h.date), h.reason]));

  const schedules = await prisma.$transaction(async (tx) => {
    const matched = await tx.schedule.findMany({
      where: { status: "UPCOMING", date: { in: holidays.map((h) => h.date) } },
      include: {
        assignments: { include: { assignedUser: { select: { name: true, email: true } } } },
      },
    });
    if (matched.length === 0) return [];

    const scheduleIds = matched.map((s) => s.id);
    await tx.schedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { status: "CANCELLED" },
    });
    await tx.scheduleAssignment.updateMany({
      where: { scheduleId: { in: scheduleIds } },
      data: { status: "CANCELLED" },
    });

    // Snapshot taken before the updates above, so assignee name/email survive the cancel.
    return matched;
  });

  const jobs = schedules.flatMap((schedule) =>
    schedule.assignments
      .filter((a) => a.assignedUserId && a.assignedUser)
      .map((a) => ({
        to: a.assignedUser!.email,
        subject: "Jumuah Duty — Assignment Cancelled",
        react: ScheduleCancelledEmail({
          name: a.assignedUser!.name,
          dutyType: a.dutyType,
          dateLabel: formatFridayDate(schedule.date),
          reason: reasonByDateKey.get(dateKey(schedule.date)),
        }),
      }))
  );
  const results = await Promise.allSettled(jobs.map((job) => emailProvider.send(job)));

  revalidatePath("/admin/settings/holidays");
  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath("/replacement-board");

  return {
    cancelledSchedules: schedules.length,
    cancelledAssignments: schedules.reduce((n, s) => n + s.assignments.length, 0),
    emailsSent: results.filter((r) => r.status === "fulfilled").length,
    emailsFailed: results.filter((r) => r.status === "rejected").length,
  };
}
