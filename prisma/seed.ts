import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "kmashhoor5@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
    create: {
      name: "إدارة ديوانية ق",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const tasks: {
    title: string;
    description: string;
    points: number;
    frequency: "DAILY" | "WEEKLY";
    requiresProof: boolean;
  }[] = [
    {
      title: "صلاتين في جماعة",
      description: "أداء صلاتين على الأقل في جماعة يوميًا",
      points: 10,
      frequency: "DAILY",
      requiresProof: false,
    },
    {
      title: "ورد صفحة من القرآن",
      description: "قراءة صفحة واحدة على الأقل من القرآن الكريم يوميًا",
      points: 10,
      frequency: "DAILY",
      requiresProof: false,
    },
    {
      title: "وتر ركعة",
      description: "أداء ركعة وتر يوميًا",
      points: 10,
      frequency: "DAILY",
      requiresProof: false,
    },
    {
      title: "قراءة ١٠ صفحات",
      description: "قراءة ١٠ صفحات من كتاب غير منهجي يوميًا",
      points: 10,
      frequency: "DAILY",
      requiresProof: true,
    },
    {
      title: "سماع المقطع",
      description: "الاستماع إلى المقطع المحدد مرة واحدة خلال الأسبوع",
      points: 15,
      frequency: "WEEKLY",
      requiresProof: false,
    },
  ];

  for (const task of tasks) {
    const existing = await prisma.habitTask.findFirst({ where: { title: task.title } });
    if (!existing) {
      await prisma.habitTask.create({ data: { ...task, createdById: admin.id } });
    }
  }

  // Demo accounts so the per-role direct-entry links work out of the box.
  // Passwords are random (login is via the /enter link); rename or delete later.
  const demoPassword = await bcrypt.hash(crypto.randomUUID(), 10);
  await prisma.user.upsert({
    where: { email: "student@leaders.local" },
    update: {},
    create: { name: "طالب تجريبي", email: "student@leaders.local", passwordHash: demoPassword, role: "STUDENT" },
  });
  await prisma.user.upsert({
    where: { email: "supervisor@leaders.local" },
    update: {},
    create: { name: "مشرف تجريبي", email: "supervisor@leaders.local", passwordHash: demoPassword, role: "SUPERVISOR" },
  });
  console.log("تم تجهيز حساب الإدارة:", adminEmail, "/", adminPassword);
  console.log("تم تجهيز المهام الافتراضية وحسابات تجريبية (طالب/مشرف).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
