import { z } from "zod";

export const dutyTypeSchema = z.enum(["ROOM_BOOKING", "KHATIB", "IMAM"]);
export const rotationDutyTypeSchema = z.enum(["KHATIB", "IMAM"]);

export const memberFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(191),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Invalid email address")),
  role: z.enum(["ADMIN", "MEMBER"]),
  canBookRoom: z.boolean(),
  canBeKhatib: z.boolean(),
  canBeImam: z.boolean(),
  isActive: z.boolean(),
});
export type MemberFormInput = z.infer<typeof memberFormSchema>;

export const settingsFormSchema = z.object({
  fixedRoomBookerId: z.string().nullable(),
  avoidSamePersonMultipleDuties: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(7),
  weeklySummaryEnabled: z.boolean(),
});
export type SettingsFormInput = z.infer<typeof settingsFormSchema>;

export const markUnavailableSchema = z.object({
  assignmentId: z.string().min(1),
  reason: z.string().trim().min(3, "Please provide a short reason").max(500),
});
export type MarkUnavailableInput = z.infer<typeof markUnavailableSchema>;

export const takeReplacementSchema = z.object({
  assignmentId: z.string().min(1),
});

export const cancelUnavailabilitySchema = z.object({
  requestId: z.string().min(1),
});

export const overrideAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  assignedUserId: z.string().nullable(),
  status: z.enum(["ASSIGNED", "REPLACEMENT_NEEDED", "CONFIRMED", "CANCELLED"]),
});

export const generateSchedulesSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((d) => d.endDate.getTime() - d.startDate.getTime() <= 366 * 86_400_000, {
    message: "Range can't exceed 1 year",
    path: ["endDate"],
  });

export const deleteScheduleSchema = z.object({
  scheduleId: z.string().min(1),
});
