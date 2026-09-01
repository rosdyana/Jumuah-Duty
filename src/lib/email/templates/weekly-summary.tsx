import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function WeeklySummaryEmail({
  dateLabel,
  roomBooker,
  khatib,
  imam,
}: {
  dateLabel: string;
  roomBooker: string;
  khatib: string;
  imam: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Jumuah Prayer Schedule for tomorrow</Preview>
      <Body style={{ fontFamily: "sans-serif", padding: "24px" }}>
        <Container>
          <Text>Assalamualaikum,</Text>
          <Text>Jumuah Prayer Schedule for tomorrow, {dateLabel}:</Text>
          <Heading as="h3">🏢 Room Booking</Heading>
          <Text>{roomBooker}</Text>
          <Heading as="h3">🎤 Khatib</Heading>
          <Text>{khatib}</Text>
          <Heading as="h3">🕌 Imam</Heading>
          <Text>{imam}</Text>
          <Text>Please check the application for more details.</Text>
        </Container>
      </Body>
    </Html>
  );
}
