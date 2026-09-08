import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth-guards";
import { getMyDuties } from "@/lib/scheduling/queries";
import { formatFridayDate } from "@/lib/format";
import { MarkUnavailableDialog } from "@/components/schedule/mark-unavailable-dialog";
import { DUTY_ICONS, DUTY_LABELS } from "@/lib/duty-labels";
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANT,
} from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function MyDutiesPage() {
  const user = await requireUser();
  const duties = await getMyDuties(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="My Upcoming Duties" />
      {duties.length === 0 ? (
        <p className="text-muted-foreground">
          You have no upcoming duties assigned.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {duties.map((duty) => {
            const DutyIcon = DUTY_ICONS[duty.dutyType];
            return (
              <Card key={duty.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DutyIcon className="size-4 text-primary" />
                    {DUTY_LABELS[duty.dutyType]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    {formatFridayDate(duty.schedule.date)}
                  </p>
                  <Badge variant={ASSIGNMENT_STATUS_VARIANT[duty.status]}>
                    {ASSIGNMENT_STATUS_LABELS[duty.status]}
                  </Badge>
                  <MarkUnavailableDialog
                    assignmentId={duty.id}
                    dutyLabel={DUTY_LABELS[duty.dutyType]}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
