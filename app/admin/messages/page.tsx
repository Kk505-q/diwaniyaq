import { requireRole } from "@/lib/guard";
import { MessagesPageBody } from "@/components/MessagesPageBody";

export default async function AdminMessagesPage() {
  await requireRole("ADMIN");
  return <MessagesPageBody />;
}
