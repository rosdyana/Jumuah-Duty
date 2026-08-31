"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memberFormSchema, type MemberFormInput } from "@/lib/validation/schemas";
import { createMember, updateMember } from "@/server/actions/members";
import { toast } from "sonner";

const DEFAULT_VALUES: MemberFormInput = {
  name: "",
  email: "",
  role: "MEMBER",
  canBookRoom: false,
  canBeKhatib: false,
  canBeImam: false,
  isActive: true,
};

export function MemberFormDialog({
  member,
}: {
  member?: { id: string } & MemberFormInput;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<MemberFormInput>(member ?? DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(member ?? DEFAULT_VALUES);
      setError(null);
    }
  }

  function handleSubmit() {
    const parsed = memberFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (member) {
          await updateMember(member.id, parsed.data);
          toast.success("Member updated");
        } else {
          await createMember(parsed.data);
          toast.success("Member added");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant={member ? "outline" : "default"} />}>
        {member ? "Edit" : "Add Member"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Add Member"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-name">Name</Label>
            <Input
              id="member-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select
              value={values.role}
              onValueChange={(role) =>
                setValues((v) => ({ ...v, role: role as MemberFormInput["role"] }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(
            [
              ["canBookRoom", "Can book room"],
              ["canBeKhatib", "Can be Khatib"],
              ["canBeImam", "Can be Imam"],
              ["isActive", "Active"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`member-${key}`}>{label}</Label>
              <Switch
                id={`member-${key}`}
                checked={values[key]}
                onCheckedChange={(checked) => setValues((v) => ({ ...v, [key]: checked }))}
              />
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
