"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { settingsFormSchema, type SettingsFormInput } from "@/lib/validation/schemas";

export async function updateSettings(input: SettingsFormInput) {
  await requireAdmin();
  const data = settingsFormSchema.parse(input);

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
