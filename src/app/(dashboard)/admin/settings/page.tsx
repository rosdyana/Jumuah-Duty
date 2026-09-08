import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, users] = await Promise.all([
    prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <SettingsForm
        initial={{
          fixedRoomBookerId: settings.fixedRoomBookerId,
          avoidSamePersonMultipleDuties: settings.avoidSamePersonMultipleDuties,
          reminderEnabled: settings.reminderEnabled,
          reminderDaysBefore: settings.reminderDaysBefore,
          weeklySummaryEnabled: settings.weeklySummaryEnabled,
        }}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
