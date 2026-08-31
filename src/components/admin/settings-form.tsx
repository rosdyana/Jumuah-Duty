"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsFormSchema, type SettingsFormInput } from "@/lib/validation/schemas";
import { updateSettings } from "@/server/actions/settings";
import { toast } from "sonner";

export function SettingsForm({
  initial,
  users,
}: {
  initial: SettingsFormInput;
  users: { id: string; name: string }[];
}) {
  const [values, setValues] = useState<SettingsFormInput>(initial);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const parsed = settingsFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    startTransition(async () => {
      try {
        await updateSettings(parsed.data);
        toast.success("Settings saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Fixed Room Booker</Label>
        <Select
          value={values.fixedRoomBookerId ?? undefined}
          onValueChange={(v) => setValues((s) => ({ ...s, fixedRoomBookerId: v }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a member..." />
          </SelectTrigger>
          <SelectContent>
            {users
              .filter((u) => u.id)
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="avoid-multi">Avoid same person on multiple duties</Label>
        <Switch
          id="avoid-multi"
          checked={values.avoidSamePersonMultipleDuties}
          onCheckedChange={(c) =>
            setValues((s) => ({ ...s, avoidSamePersonMultipleDuties: c }))
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="reminder-enabled">H-1 reminder enabled</Label>
        <Switch
          id="reminder-enabled"
          checked={values.reminderEnabled}
          onCheckedChange={(c) => setValues((s) => ({ ...s, reminderEnabled: c }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reminder-days">Reminder days before</Label>
        <Input
          id="reminder-days"
          type="number"
          min={0}
          max={7}
          value={values.reminderDaysBefore}
          onChange={(e) =>
            setValues((s) => ({ ...s, reminderDaysBefore: Number(e.target.value) }))
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="weekly-summary">Weekly summary email</Label>
        <Switch
          id="weekly-summary"
          checked={values.weeklySummaryEnabled}
          onCheckedChange={(c) => setValues((s) => ({ ...s, weeklySummaryEnabled: c }))}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isPending} className="w-fit">
        Save Settings
      </Button>
    </div>
  );
}
