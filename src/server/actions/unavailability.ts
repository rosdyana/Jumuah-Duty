"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import {
  markUnavailableSchema,
  cancelUnavailabilitySchema,
  type MarkUnavailableInput,
} from "@/lib/validation/schemas";

export async function markUnavailable(input: MarkUnavailableInput) {
  const user = await requireUser();
  const { assignmentId, reason } = markUnavailableSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.scheduleAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { schedule: true },
    });

    if (assignment.assignedUserId !== user.id && user.role !== "ADMIN") {
      throw new Error("You can only mark your own assignments unavailable");
    }
    if (!["ASSIGNED", "CONFIRMED"].includes(assignment.status)) {
      throw new Error("This assignment is not currently active");
    }
    if (assignment.schedule.date.getTime() < Date.now()) {
      throw new Error("This assignment's date has already passed");
    }

    const existing = await tx.unavailabilityRequest.findFirst({
      where: {
        userId: assignment.assignedUserId!,
        scheduleId: assignment.scheduleId,
        dutyType: assignment.dutyType,
        status: "ACTIVE",
      },
    });
    if (existing) {
      throw new Error("An unavailability request already exists for this assignment");
    }

    await tx.unavailabilityRequest.create({
      data: {
        userId: assignment.assignedUserId!,
        scheduleId: assignment.scheduleId,
        dutyType: assignment.dutyType,
        reason,
        status: "ACTIVE",
      },
    });

    await tx.scheduleAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "REPLACEMENT_NEEDED",
        originalUserId: assignment.assignedUserId,
        assignedUserId: null,
      },
    });
  });

  revalidatePath("/my-duties");
  revalidatePath("/replacement-board");
  revalidatePath("/");
  revalidatePath("/upcoming");
}

export async function cancelUnavailability(input: { requestId: string }) {
  const user = await requireUser();
  const { requestId } = cancelUnavailabilitySchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const request = await tx.unavailabilityRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    if (request.userId !== user.id && user.role !== "ADMIN") {
      throw new Error("You can only cancel your own unavailability requests");
    }
    if (request.status !== "ACTIVE") {
      throw new Error("This request is no longer active");
    }

    const assignment = await tx.scheduleAssignment.findFirst({
      where: { scheduleId: request.scheduleId, dutyType: request.dutyType },
    });
    if (assignment?.status === "CONFIRMED") {
      throw new Error("A replacement has already taken this duty — ask an admin to override it");
    }

    await tx.unavailabilityRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    if (assignment) {
      await tx.scheduleAssignment.update({
        where: { id: assignment.id },
        data: { status: "ASSIGNED", assignedUserId: request.userId },
      });
    }
  });

  revalidatePath("/my-duties");
  revalidatePath("/replacement-board");
  revalidatePath("/");
  revalidatePath("/upcoming");
}
