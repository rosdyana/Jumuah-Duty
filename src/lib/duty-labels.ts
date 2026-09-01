import type { DutyType } from "@/generated/prisma/enums";

export const DUTY_ORDER: DutyType[] = ["ROOM_BOOKING", "KHATIB", "IMAM"];

export const DUTY_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "🏢 Room Booking",
  KHATIB: "🎤 Khatib",
  IMAM: "🕌 Imam",
};

export const DUTY_SHORT_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "🏢",
  KHATIB: "🎤",
  IMAM: "🕌",
};
