import { prisma } from "@/lib/prisma";
import { generateScheduleForDate as computeSchedule } from "./generate-schedule";
import type { DutyType, GenerationOutcome, RotationInput } from "./types";

export interface GenerateResult {
  scheduleId: string;
  date: Date;
  status: "CREATED" | "ALREADY_GENERATED";
  outcome?: GenerationOutcome;
}

/**
 * Generates and persists a single Friday's assignments (PRD section 6), or no-ops if
 * assignments already exist for that date (idempotent — re-generation goes through
 * Manual Override, not silent overwrite). Runs in one transaction so rotation_state
 * pointer writes are atomic with the assignments they produced.
 */
export async function generateAndPersistSchedule(dateOnly: Date): Promise<GenerateResult> {
  return prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.upsert({
      where: { date: dateOnly },
      create: { date: dateOnly, status: "UPCOMING" },
      update: {},
    });

    const existingCount = await tx.scheduleAssignment.count({
      where: { scheduleId: schedule.id },
    });
    if (existingCount > 0) {
      return { scheduleId: schedule.id, date: dateOnly, status: "ALREADY_GENERATED" as const };
    }

    const [settings, users, khatibRotation, imamRotation, khatibState, imamState, unavailable] =
      await Promise.all([
        tx.appSettings.findUniqueOrThrow({ where: { id: "singleton" } }),
        tx.user.findMany(),
        tx.rotationMember.findMany({
          where: { dutyType: "KHATIB" },
          orderBy: { rotationOrder: "asc" },
        }),
        tx.rotationMember.findMany({
          where: { dutyType: "IMAM" },
          orderBy: { rotationOrder: "asc" },
        }),
        tx.rotationState.findUnique({ where: { dutyType: "KHATIB" } }),
        tx.rotationState.findUnique({ where: { dutyType: "IMAM" } }),
        tx.unavailabilityRequest.findMany({
          where: { scheduleId: schedule.id, status: "ACTIVE" },
        }),
      ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const unavailableByDuty = (duty: DutyType) =>
      new Set(unavailable.filter((r) => r.dutyType === duty).map((r) => r.userId));

    const eligible = (
      rows: typeof khatibRotation,
      capability: "canBeKhatib" | "canBeImam"
    ): RotationInput["members"] =>
      rows
        .filter((r) => {
          const user = userMap.get(r.userId);
          return user?.isActive && user[capability];
        })
        .map((r) => ({ userId: r.userId, rotationOrder: r.rotationOrder }));

    const fixedRoomBookerId = settings.fixedRoomBookerId;
    const fixedUser = fixedRoomBookerId ? userMap.get(fixedRoomBookerId) : undefined;

    const outcome = computeSchedule({
      fixedRoomBookerId: fixedRoomBookerId ?? null,
      roomBookerEligible: !!(fixedUser?.isActive && fixedUser?.canBookRoom),
      roomBookerAvailable: fixedRoomBookerId
        ? !unavailableByDuty("ROOM_BOOKING").has(fixedRoomBookerId)
        : false,
      khatibInput: {
        members: eligible(khatibRotation, "canBeKhatib"),
        unavailableUserIds: unavailableByDuty("KHATIB"),
        lastAssignedUserId: khatibState?.lastAssignedUserId ?? null,
      },
      buildImamInput: (khatibPick) => ({
        members: eligible(imamRotation, "canBeImam"),
        unavailableUserIds: unavailableByDuty("IMAM"),
        lastAssignedUserId: imamState?.lastAssignedUserId ?? null,
        excludeUserId: settings.avoidSamePersonMultipleDuties ? khatibPick : null,
      }),
    });

    await tx.scheduleAssignment.createMany({
      data: [
        {
          scheduleId: schedule.id,
          dutyType: "ROOM_BOOKING",
          assignedUserId: outcome.roomBooking.assignedUserId,
          originalUserId: outcome.roomBooking.originalUserId,
          assignmentType: outcome.roomBooking.assignmentType,
          status: outcome.roomBooking.status,
        },
        {
          scheduleId: schedule.id,
          dutyType: "KHATIB",
          assignedUserId: outcome.khatib.assignedUserId,
          originalUserId: outcome.khatib.originalUserId,
          assignmentType: outcome.khatib.assignmentType,
          status: outcome.khatib.status,
        },
        {
          scheduleId: schedule.id,
          dutyType: "IMAM",
          assignedUserId: outcome.imam.assignedUserId,
          originalUserId: outcome.imam.originalUserId,
          assignmentType: outcome.imam.assignmentType,
          status: outcome.imam.status,
        },
      ],
    });

    // Always write — newPointerUserId already encodes "leave unchanged" when nobody
    // was selected (see selectNextCandidate), so this is safe even as a same-value no-op.
    await tx.rotationState.update({
      where: { dutyType: "KHATIB" },
      data: { lastAssignedUserId: outcome.khatib.newPointerUserId },
    });
    await tx.rotationState.update({
      where: { dutyType: "IMAM" },
      data: { lastAssignedUserId: outcome.imam.newPointerUserId },
    });

    return { scheduleId: schedule.id, date: dateOnly, status: "CREATED" as const, outcome };
  });
}

/**
 * Generates multiple Fridays. MUST run sequentially (not Promise.all) — each date's
 * rotation input depends on rotation_state as written by the previous date in the batch.
 */
export async function generateUpcomingSchedules(dates: Date[]): Promise<GenerateResult[]> {
  const results: GenerateResult[] = [];
  for (const date of dates) {
    results.push(await generateAndPersistSchedule(date));
  }
  return results;
}
