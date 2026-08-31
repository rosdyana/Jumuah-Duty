"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { takeReplacementSchema } from "@/lib/validation/schemas";
import type { DutyType } from "@/generated/prisma/enums";

const CAPABILITY_BY_DUTY: Record<DutyType, "canBookRoom" | "canBeKhatib" | "canBeImam"> = {
  ROOM_BOOKING: "canBookRoom",
  KHATIB: "canBeKhatib",
  IMAM: "canBeImam",
};

export async function takeReplacement(input: { assignmentId: string }) {
  const user = await requireUser();
  const { assignmentId } = takeReplacementSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.scheduleAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { schedule: true },
    });

    if (assignment.status !== "REPLACEMENT_NEEDED") {
      throw new Error("This duty no longer needs a replacement");
    }
    if (assignment.schedule.date.getTime() < Date.now()) {
      throw new Error("This assignment's date has already passed");
    }

    const capability = CAPABILITY_BY_DUTY[assignment.dutyType];
    if (!user[capability]) {
      throw new Error("You don't have the required capability for this duty");
    }

    const ownUnavailability = await tx.unavailabilityRequest.findFirst({
      where: {
        userId: user.id,
        scheduleId: assignment.scheduleId,
        dutyType: assignment.dutyType,
        status: "ACTIVE",
      },
    });
    if (ownUnavailability) {
      throw new Error("You're marked unavailable for this slot yourself");
    }

    await tx.scheduleAssignment.update({
      where: { id: assignmentId },
      data: { assignedUserId: user.id, assignmentType: "REPLACEMENT", status: "CONFIRMED" },
    });

    // Resolve the unavailability request that created this opening, if one exists —
    // the room-booking NONE_AVAILABLE-at-generation edge case has none.
    if (assignment.originalUserId) {
      await tx.unavailabilityRequest.updateMany({
        where: {
          userId: assignment.originalUserId,
          scheduleId: assignment.scheduleId,
          dutyType: assignment.dutyType,
          status: "ACTIVE",
        },
        data: { status: "RESOLVED" },
      });
    }
  });

  revalidatePath("/replacement-board");
  revalidatePath("/my-duties");
  revalidatePath("/");
  revalidatePath("/upcoming");
}
