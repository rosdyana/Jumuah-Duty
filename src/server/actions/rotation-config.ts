"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { rotationDutyTypeSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

type RotationDutyType = z.infer<typeof rotationDutyTypeSchema>;

export async function addRotationMember(dutyType: RotationDutyType, userId: string) {
  await requireAdmin();
  rotationDutyTypeSchema.parse(dutyType);

  const maxOrder = await prisma.rotationMember.aggregate({
    where: { dutyType },
    _max: { rotationOrder: true },
  });

  await prisma.rotationMember.create({
    data: { dutyType, userId, rotationOrder: (maxOrder._max.rotationOrder ?? 0) + 1 },
  });

  revalidatePath("/admin/rotation");
}

export async function removeRotationMember(id: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const removed = await tx.rotationMember.delete({ where: { id } });

    // Re-pack remaining rotationOrder values to stay contiguous (1..N).
    const remaining = await tx.rotationMember.findMany({
      where: { dutyType: removed.dutyType },
      orderBy: { rotationOrder: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].rotationOrder !== i + 1) {
        await tx.rotationMember.update({
          where: { id: remaining[i].id },
          data: { rotationOrder: i + 1 },
        });
      }
    }
  });

  revalidatePath("/admin/rotation");
}

export async function moveRotationMember(id: string, direction: "up" | "down") {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const member = await tx.rotationMember.findUniqueOrThrow({ where: { id } });
    const neighbor = await tx.rotationMember.findFirst({
      where: {
        dutyType: member.dutyType,
        rotationOrder:
          direction === "up" ? { lt: member.rotationOrder } : { gt: member.rotationOrder },
      },
      orderBy: { rotationOrder: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbor) return; // already at the boundary

    // 3-step swap through a sentinel value: rotationOrder is always >= 1, so -1 can
    // never collide with a real value, which avoids a transient unique-constraint
    // violation ([dutyType, rotationOrder]) between the two updates.
    await tx.rotationMember.update({ where: { id: member.id }, data: { rotationOrder: -1 } });
    await tx.rotationMember.update({
      where: { id: neighbor.id },
      data: { rotationOrder: member.rotationOrder },
    });
    await tx.rotationMember.update({
      where: { id: member.id },
      data: { rotationOrder: neighbor.rotationOrder },
    });
  });

  revalidatePath("/admin/rotation");
}
