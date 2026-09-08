import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { formatFridayDate } from "@/lib/format";
import { OverrideAssignmentRow } from "@/components/admin/override-assignment-row";
import { DUTY_LABELS, DUTY_ORDER } from "@/lib/duty-labels";

export const dynamic = "force-dynamic";

export default async function AdminScheduleOverridePage(
  props: PageProps<"/admin/schedules/[id]">
) {
  const { id } = await props.params;

  const [schedule, users] = await Promise.all([
    prisma.schedule.findUnique({
      where: { id },
      include: { assignments: true },
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!schedule) notFound();

  const byDuty = new Map(schedule.assignments.map((a) => [a.dutyType, a]));

  return (
    <div className="space-y-6">
      <PageHeader title={`Manual Override — ${formatFridayDate(schedule.date)}`} />
      <div className="flex flex-col gap-3">
        {DUTY_ORDER.map((dutyType) => {
          const assignment = byDuty.get(dutyType);
          if (!assignment) return null;
          return (
            <OverrideAssignmentRow
              key={assignment.id}
              assignmentId={assignment.id}
              dutyLabel={DUTY_LABELS[dutyType]}
              assignedUserId={assignment.assignedUserId}
              status={assignment.status}
              users={users.map((u) => ({ id: u.id, name: u.name }))}
            />
          );
        })}
      </div>
    </div>
  );
}
