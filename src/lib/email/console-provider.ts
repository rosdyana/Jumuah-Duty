import type { EmailMessage, EmailProvider } from "./provider";

/** Logs instead of sending — used in local dev when RESEND_API_KEY isn't set. */
export class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:console] to=${message.to} subject="${message.subject}"`);
  }
}
