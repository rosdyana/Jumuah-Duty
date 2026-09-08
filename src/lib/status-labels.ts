import type { AssignmentStatus, UnavailabilityStatus } from "@/generated/prisma/enums";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  ASSIGNED: "Assigned",
  REPLACEMENT_NEEDED: "Replacement needed",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export const ASSIGNMENT_STATUS_VARIANT: Record<AssignmentStatus, BadgeVariant> = {
  ASSIGNED: "secondary",
  REPLACEMENT_NEEDED: "destructive",
  CONFIRMED: "default",
  CANCELLED: "outline",
};

export const UNAVAILABILITY_STATUS_LABELS: Record<UnavailabilityStatus, string> = {
  ACTIVE: "Active",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

export const UNAVAILABILITY_STATUS_VARIANT: Record<UnavailabilityStatus, BadgeVariant> = {
  ACTIVE: "destructive",
  RESOLVED: "default",
  CANCELLED: "outline",
};
