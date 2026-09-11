import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { DUTY_LABELS } from "@/lib/duty-labels";
import type { DutyType } from "@/generated/prisma/enums";

export function ScheduleCancelledEmail({
  name,
  dutyType,
  dateLabel,
  reason,
}: {
  name: string;
  dutyType: DutyType;
  dateLabel: string;
  reason?: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Jumuah duty on {dateLabel} has been cancelled</Preview>
      <Body style={{ fontFamily: "sans-serif", padding: "24px" }}>
        <Container>
          <Text>Assalamualaikum {name},</Text>
          <Text>
            Your assignment for <strong>{DUTY_LABELS[dutyType]}</strong> on {dateLabel} has been
            cancelled because this date has been marked as a holiday
            {reason ? ` (${reason})` : ""}.
          </Text>
          <Heading as="h3">Date:</Heading>
          <Text>{dateLabel}</Text>
          <Text>No action is needed from you for this date.</Text>
          <Text>Jazakallahu Khairan.</Text>
        </Container>
      </Body>
    </Html>
  );
}
