import type { EmailProvider } from "./provider";
import { ResendProvider } from "./resend-provider";
import { ConsoleProvider } from "./console-provider";

function createEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Jumuah Duty Scheduler <noreply@example.com>";
  if (!apiKey) {
    return new ConsoleProvider();
  }
  return new ResendProvider(apiKey, from);
}

export const emailProvider: EmailProvider = createEmailProvider();
export type { EmailProvider, EmailMessage } from "./provider";
