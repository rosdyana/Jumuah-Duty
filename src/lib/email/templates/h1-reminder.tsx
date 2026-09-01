import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

const DUTY_LABELS: Record<string, string> = {
  ROOM_BOOKING: "🏢 Room Booking",
  KHATIB: "🎤 Khatib",
  IMAM: "🕌 Imam",
};

export function H1ReminderEmail({
  name,
  dutyType,
  dateLabel,
}: {
  name: string;
  dutyType: string;
  dateLabel: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reminder for tomorrow&apos;s Jumuah Prayer</Preview>
      <Body style={{ fontFamily: "sans-serif", padding: "24px" }}>
        <Container>
          <Text>Assalamualaikum {name},</Text>
          <Text>This is a reminder for tomorrow&apos;s Jumuah Prayer.</Text>
          <Heading as="h3">Your assignment:</Heading>
          <Text>{DUTY_LABELS[dutyType] ?? dutyType}</Text>
          <Heading as="h3">Date:</Heading>
          <Text>{dateLabel}</Text>
          <Text>Please prepare accordingly.</Text>
          <Text>Jazakallahu Khairan.</Text>
        </Container>
      </Body>
    </Html>
  );
}
