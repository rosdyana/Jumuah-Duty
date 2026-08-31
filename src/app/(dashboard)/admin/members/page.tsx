import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { MemberFormDialog } from "@/components/admin/member-form-dialog";
import { MemberActiveToggle } from "@/components/admin/member-active-toggle";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <MemberFormDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Capabilities</TableHead>
            <TableHead>Active</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell className="text-muted-foreground">{member.email}</TableCell>
              <TableCell>
                <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="flex flex-wrap gap-1">
                {member.canBookRoom && <Badge variant="outline">Room</Badge>}
                {member.canBeKhatib && <Badge variant="outline">Khatib</Badge>}
                {member.canBeImam && <Badge variant="outline">Imam</Badge>}
              </TableCell>
              <TableCell>
                <MemberActiveToggle userId={member.id} isActive={member.isActive} />
              </TableCell>
              <TableCell>
                <MemberFormDialog member={member} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
