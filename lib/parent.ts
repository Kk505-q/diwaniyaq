import { prisma } from "@/lib/db";

export async function getParentChildren(parentId: string) {
  const links = await prisma.parentChild.findMany({
    where: { parentId },
    include: { student: true },
    orderBy: { student: { name: "asc" } },
  });
  return links.map((l) => l.student);
}
