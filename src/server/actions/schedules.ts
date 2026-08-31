"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { generateUpcomingSchedules } from "@/lib/scheduling/persist";
import { getNextNFridays } from "@/lib/scheduling/fridays";
import { generateSchedulesSchema, overrideAssignmentSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

export async function generateSchedules(input: z.infer<typeof generateSchedulesSchema>) {
  await requireAdmin();
  const { count, startDate } = generateSchedulesSchema.parse(input);

  const dates = getNextNFridays(count, startDate);
  const results = await generateUpcomingSchedules(dates);

  revalidatePath("/admin/schedules");
  revalidatePath("/");
  revalidatePath("/upcoming");

  return results;
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
