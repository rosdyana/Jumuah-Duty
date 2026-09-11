"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert";

// This project's Next.js build passes `retry` (stable since v16.3.0), not the
// `reset` prop used in stock Next.js — see node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/error.md.
export default function HolidaysError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Couldn&apos;t load the holiday whitelist</AlertTitle>
      <AlertDescription>
        {error.digest
          ? `Something went wrong on our end (ref: ${error.digest}).`
          : "Something went wrong on our end."}
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={() => retry()}>
          Try again
        </Button>
      </AlertAction>
    </Alert>
  );
}
