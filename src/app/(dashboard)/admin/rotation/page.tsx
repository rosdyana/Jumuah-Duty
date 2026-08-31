import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { RotationList } from "@/components/admin/rotation-list";

export const dynamic = "force-dynamic";

export default async function AdminRotationPage() {
  const [khatibMembers, imamMembers, users] = await Promise.all([
    prisma.rotationMember.findMany({
      where: { dutyType: "KHATIB" },
      orderBy: { rotationOrder: "asc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.rotationMember.findMany({
      where: { dutyType: "IMAM" },
      orderBy: { rotationOrder: "asc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const khatibUserIds = new Set(khatibMembers.map((m) => m.userId));
  const imamUserIds = new Set(imamMembers.map((m) => m.userId));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Rotation Configuration</h1>
      <Tabs defaultValue="khatib">
        <TabsList>
          <TabsTrigger value="khatib">Khatib</TabsTrigger>
          <TabsTrigger value="imam">Imam</TabsTrigger>
        </TabsList>
        <TabsContent value="khatib">
          <RotationList
            dutyType="KHATIB"
            members={khatibMembers.map((m) => ({
              id: m.id,
              userId: m.userId,
              userName: m.user.name,
              rotationOrder: m.rotationOrder,
            }))}
            eligibleToAdd={users
              .filter((u) => u.canBeKhatib && !khatibUserIds.has(u.id))
              .map((u) => ({ id: u.id, name: u.name }))}
          />
        </TabsContent>
        <TabsContent value="imam">
          <RotationList
            dutyType="IMAM"
            members={imamMembers.map((m) => ({
              id: m.id,
              userId: m.userId,
              userName: m.user.name,
              rotationOrder: m.rotationOrder,
            }))}
            eligibleToAdd={users
              .filter((u) => u.canBeImam && !imamUserIds.has(u.id))
              .map((u) => ({ id: u.id, name: u.name }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
