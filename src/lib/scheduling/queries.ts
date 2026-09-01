import { prisma } from "@/lib/prisma";
import { todayDateOnly } from "@/lib/scheduling/fridays";

const ASSIGNMENT_INCLUDE = {
  assignedUser: { select: { id: true, name: true } },
  originalUser: { select: { id: true, name: true } },
} as const;

export async function getSchedulesInRange(start: Date, end: Date) {
  return prisma.schedule.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    include: { assignments: { include: ASSIGNMENT_INCLUDE } },
  });
}

export async function getUpcomingSchedules(limit: number) {
  return prisma.schedule.findMany({
    where: { status: "UPCOMING", date: { gte: todayDateOnly() } },
    orderBy: { date: "asc" },
    take: limit,
    include: { assignments: { include: ASSIGNMENT_INCLUDE } },
  });
}

export async function getNearestUpcomingSchedule() {
  const [schedule] = await getUpcomingSchedules(1);
  return schedule ?? null;
}

export async function getMyDuties(userId: string) {
  return prisma.scheduleAssignment.findMany({
    where: {
      assignedUserId: userId,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      schedule: { date: { gte: todayDateOnly() }, status: "UPCOMING" },
    },
    orderBy: { schedule: { date: "asc" } },
    include: { schedule: true },
  });
}

export async function getReplacementNeeded() {
  const assignments = await prisma.scheduleAssignment.findMany({
    where: {
      status: "REPLACEMENT_NEEDED",
      schedule: { date: { gte: todayDateOnly() }, status: "UPCOMING" },
    },
    orderBy: { schedule: { date: "asc" } },
    include: {
      schedule: {
        include: {
          unavailabilityRequests: { where: { status: "ACTIVE" } },
        },
      },
      originalUser: { select: { id: true, name: true } },
    },
  });

  return assignments.map((a) => ({
    ...a,
    reason: a.schedule.unavailabilityRequests.find((r) => r.dutyType === a.dutyType)?.reason,
  }));
}
