"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { generateUpcomingSchedules } from "@/lib/scheduling/persist";
import { getFridaysInRange, todayDateOnly } from "@/lib/scheduling/fridays";
import {
  deleteScheduleSchema,
  generateSchedulesSchema,
  overrideAssignmentSchema,
} from "@/lib/validation/schemas";
import type { z } from "zod";

export async function generateSchedules(input: z.infer<typeof generateSchedulesSchema>) {
  await requireAdmin();
  const { startDate, endDate } = generateSchedulesSchema.parse(input);

  const dates = getFridaysInRange(startDate, endDate);
  const results = await generateUpcomingSchedules(dates);

  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");

  return results;
}

export async function deleteSchedule(input: z.infer<typeof deleteScheduleSchema>) {
  await requireAdmin();
  const { scheduleId } = deleteScheduleSchema.parse(input);

  await prisma.schedule.delete({ where: { id: scheduleId } });

  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");
}

export async function clearUpcomingSchedules() {
  await requireAdmin();

  const { count } = await prisma.schedule.deleteMany({
    where: { status: "UPCOMING", date: { gte: todayDateOnly() } },
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");

  return count;
}

export async function overrideAssignment(input: z.infer<typeof overrideAssignmentSchema>) {
  await requireAdmin();
  const { assignmentId, assignedUserId, status } = overrideAssignmentSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.scheduleAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
    });

    await tx.scheduleAssignment.update({
      where: { id: assignmentId },
      data: {
        assignedUserId,
        status,
        assignmentType: "MANUAL",
        // Preserve original assignee for audit if one was already recorded; otherwise
        // (e.g. the NONE_AVAILABLE edge case had left it null) record this pick so
        // history stays meaningful.
        originalUserId: assignment.originalUserId ?? assignedUserId,
      },
    });

    if (assignedUserId) {
      await tx.unavailabilityRequest.updateMany({
        where: {
          scheduleId: assignment.scheduleId,
          dutyType: assignment.dutyType,
          status: "ACTIVE",
        },
        data: { status: "RESOLVED" },
      });
    }
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath("/replacement-board");
}
