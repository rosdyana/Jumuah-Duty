"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addRotationMember,
  moveRotationMember,
  removeRotationMember,
} from "@/server/actions/rotation-config";
import { toast } from "sonner";

type RotationDutyType = "KHATIB" | "IMAM";

export function RotationList({
  dutyType,
  members,
  eligibleToAdd,
}: {
  dutyType: RotationDutyType;
  members: { id: string; userId: string; userName: string; rotationOrder: number }[];
  eligibleToAdd: { id: string; name: string }[];
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function runAction(fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {members.map((member, i) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-sm">
              <span className="mr-2 text-muted-foreground">{i + 1}.</span>
              {member.userName}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isPending || i === 0}
                onClick={() => runAction(() => moveRotationMember(member.id, "up"))}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isPending || i === members.length - 1}
                onClick={() => runAction(() => moveRotationMember(member.id, "down"))}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isPending}
                onClick={() => runAction(() => removeRotationMember(member.id))}
              >
                ✕
              </Button>
            </div>
          </li>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">No one in this rotation yet.</p>
        )}
      </ol>
      <div className="flex gap-2">
        <Select
          value={selectedUserId}
          onValueChange={(value) => setSelectedUserId(value ?? undefined)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add a member..." />
          </SelectTrigger>
          <SelectContent>
            {eligibleToAdd.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={isPending || !selectedUserId}
          onClick={() => {
            if (!selectedUserId) return;
            runAction(() => addRotationMember(dutyType, selectedUserId));
            setSelectedUserId(undefined);
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
