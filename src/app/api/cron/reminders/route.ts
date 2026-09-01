import { sendH1RemindersIfDue, sendWeeklySummaryIfDue } from "@/lib/email/send-reminders";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [reminder, weekly] = await Promise.all([
    sendH1RemindersIfDue(),
    sendWeeklySummaryIfDue(),
  ]);

  return Response.json({ reminder, weekly });
}
