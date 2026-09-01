import type { ReactElement } from "react";

export interface EmailMessage {
  to: string;
  subject: string;
  react: ReactElement;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
