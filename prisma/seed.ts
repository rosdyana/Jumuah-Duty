import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";

  if (!adminEmail) {
    throw new Error("SEED_ADMIN_EMAIL must be set (see env.example) before seeding.");
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      isActive: true,
      canBookRoom: true,
      canBeKhatib: true,
      canBeImam: true,
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  await prisma.rotationState.upsert({
    where: { dutyType: "KHATIB" },
    update: {},
    create: { dutyType: "KHATIB" },
  });

  await prisma.rotationState.upsert({
    where: { dutyType: "IMAM" },
    update: {},
    create: { dutyType: "IMAM" },
  });

  console.log(`Seeded bootstrap admin: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
