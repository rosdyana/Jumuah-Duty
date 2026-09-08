import type { DutyType } from "@/generated/prisma/enums";
import { Building2, Landmark, Mic2 } from "lucide-react";

export const DUTY_ORDER: DutyType[] = ["ROOM_BOOKING", "KHATIB", "IMAM"];

export const DUTY_LABELS: Record<DutyType, string> = {
  ROOM_BOOKING: "Room Booking",
  KHATIB: "Khatib",
  IMAM: "Imam",
};

export const DUTY_ICONS: Record<DutyType, typeof Building2> = {
  ROOM_BOOKING: Building2,
  KHATIB: Mic2,
  IMAM: Landmark,
};
