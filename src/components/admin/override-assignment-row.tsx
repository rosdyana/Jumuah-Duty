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
import { overrideAssignment } from "@/server/actions/schedules";
import { toast } from "sonner";

const STATUS_OPTIONS = ["ASSIGNED", "REPLACEMENT_NEEDED", "CONFIRMED", "CANCELLED"] as const;
const UNASSIGNED = "__unassigned__";

export function OverrideAssignmentRow({
  assignmentId,
  dutyLabel,
  assignedUserId,
  status,
  users,
}: {
  assignmentId: string;
  dutyLabel: string;
  assignedUserId: string | null;
  status: string;
  users: { id: string; name: string }[];
}) {
  const [userId, setUserId] = useState(assignedUserId ?? UNASSIGNED);
  const [rowStatus, setRowStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await overrideAssignment({
          assignmentId,
          assignedUserId: userId === UNASSIGNED ? null : userId,
          status: rowStatus as (typeof STATUS_OPTIONS)[number],
        });
        toast.success(`${dutyLabel} updated`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="min-w-32 font-medium">{dutyLabel}</div>
      <Select value={userId} onValueChange={(v) => setUserId(v ?? UNASSIGNED)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={rowStatus} onValueChange={(v) => v && setRowStatus(v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleSave} disabled={isPending}>
        Save
      </Button>
    </div>
  );
}
