"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { memberFormSchema, type MemberFormInput } from "@/lib/validation/schemas";

export async function createMember(input: MemberFormInput) {
  await requireAdmin();
  const data = memberFormSchema.parse(input);

  await prisma.user.create({ data });

  revalidatePath("/admin/members");
}

export async function updateMember(userId: string, input: MemberFormInput) {
  await requireAdmin();
  const data = memberFormSchema.parse(input);

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/admin/members");
}

export async function setMemberActive(userId: string, isActive: boolean) {
  await requireAdmin();

  await prisma.user.update({ where: { id: userId }, data: { isActive } });

  revalidatePath("/admin/members");
}
