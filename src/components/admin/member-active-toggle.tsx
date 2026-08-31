"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setMemberActive } from "@/server/actions/members";
import { toast } from "sonner";

export function MemberActiveToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          try {
            await setMemberActive(userId, checked);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
          }
        });
      }}
    />
  );
}
