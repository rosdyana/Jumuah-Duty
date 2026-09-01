import { prisma } from "@/lib/prisma";
import { emailProvider } from "@/lib/email";
import { formatFridayDate } from "@/lib/format";
import { addDays, isFriday, todayDateOnly, nextFridayOnOrAfter } from "@/lib/scheduling/fridays";
import { H1ReminderEmail } from "@/lib/email/templates/h1-reminder";
import { WeeklySummaryEmail } from "@/lib/email/templates/weekly-summary";
import type { DutyType } from "@/generated/prisma/enums";

const WEEKLY_SUMMARY_DAY_OF_WEEK = 1; // Monday (0 = Sunday)

type ReminderResult = { skipped: string } | { sent: number };

/** Runs daily; a no-op unless tomorrow is a Friday with a pending, unsent reminder. */
export async function sendH1RemindersIfDue(now = new Date()): Promise<ReminderResult> {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.reminderEnabled) return { skipped: "disabled" };

  const target = addDays(todayDateOnly(undefined, now), settings.reminderDaysBefore);
  if (!isFriday(target)) return { skipped: "not-friday" };

  const schedule = await prisma.schedule.findFirst({
    where: { date: target, status: "UPCOMING" },
  });
  if (!schedule) return { skipped: "no-schedule" };

  try {
    await prisma.notificationLog.create({
      data: { scheduleId: schedule.id, type: "H1_REMINDER" },
    });
  } catch {
    return { skipped: "already-sent" };
  }

  const assignments = await prisma.scheduleAssignment.findMany({
    where: {
      scheduleId: schedule.id,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      assignedUserId: { not: null },
    },
    include: { assignedUser: { select: { name: true, email: true } } },
  });

  const dateLabel = formatFridayDate(schedule.date);
  const results = await Promise.allSettled(
    assignments.map((a) =>
      emailProvider.send({
        to: a.assignedUser!.email,
        subject: "Jumuah Duty Reminder — Tomorrow",
        react: H1ReminderEmail({
          name: a.assignedUser!.name,
          dutyType: a.dutyType,
          dateLabel,
        }),
      })
    )
  );

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}

/** Runs daily; a no-op unless today is the configured weekly-summary day. */
export async function sendWeeklySummaryIfDue(now = new Date()): Promise<ReminderResult> {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.weeklySummaryEnabled) return { skipped: "disabled" };

  const today = todayDateOnly(undefined, now);
  if (today.getUTCDay() !== WEEKLY_SUMMARY_DAY_OF_WEEK) return { skipped: "not-summary-day" };

  const upcomingFriday = nextFridayOnOrAfter(today);
  const schedule = await prisma.schedule.findFirst({
    where: { date: upcomingFriday, status: "UPCOMING" },
    include: { assignments: { include: { assignedUser: { select: { name: true } } } } },
  });
  if (!schedule) return { skipped: "no-schedule" };

  try {
    await prisma.notificationLog.create({
      data: { scheduleId: schedule.id, type: "WEEKLY_SUMMARY" },
    });
  } catch {
    return { skipped: "already-sent" };
  }

  const byDuty = new Map(schedule.assignments.map((a) => [a.dutyType, a]));
  const nameFor = (dutyType: DutyType) => byDuty.get(dutyType)?.assignedUser?.name ?? "TBD";

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { email: true },
  });

  const dateLabel = formatFridayDate(schedule.date);
  const results = await Promise.allSettled(
    activeUsers.map((u) =>
      emailProvider.send({
        to: u.email,
        subject: "Jumuah Prayer Schedule — This Week",
        react: WeeklySummaryEmail({
          dateLabel,
          roomBooker: nameFor("ROOM_BOOKING"),
          khatib: nameFor("KHATIB"),
          imam: nameFor("IMAM"),
        }),
      })
    )
  );

  return { sent: results.filter((r) => r.status === "fulfilled").length };
}
