import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { HolidayCalendarPicker } from "@/components/admin/holiday-calendar-picker";
import { HolidayList } from "@/components/admin/holiday-list";
import { ApplyHolidaysButton } from "@/components/admin/apply-holidays-button";
import { dateKey } from "@/lib/scheduling/fridays";

export const dynamic = "force-dynamic";

export default async function AdminHolidaysPage() {
  const [holidays, upcomingSchedules] = await Promise.all([
    prisma.holiday.findMany({
      orderBy: { date: "asc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.schedule.findMany({
      where: { status: "UPCOMING" },
      include: {
        assignments: { include: { assignedUser: { select: { name: true, email: true } } } },
      },
    }),
  ]);

  const holidayKeys = new Set(holidays.map((h) => dateKey(h.date)));
  const matchedSchedules = upcomingSchedules.filter((s) => holidayKeys.has(dateKey(s.date)));
  const affectedAssignmentCount = matchedSchedules.reduce(
    (n, s) => n + s.assignments.filter((a) => a.assignedUserId).length,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Holiday Whitelist" />
      <p className="text-sm text-muted-foreground">
        Dates whitelisted here are skipped by future schedule generation. Use &quot;Apply to
        Current Schedule&quot; to also cancel any already-generated schedules that match —
        affected assignees are notified by email.
      </p>

      <HolidayCalendarPicker existingHolidayDateKeys={[...holidayKeys]} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title="Whitelisted dates"
            description="Fridays currently excluded from generation."
          />
          <ApplyHolidaysButton
            matchedDates={matchedSchedules.map((s) => s.date)}
            affectedAssignmentCount={affectedAssignmentCount}
          />
        </div>
        <HolidayList holidays={holidays} />
      </div>
    </div>
  );
}
