import { requireRole } from "@/lib/guard";
import { MessagesPageBody } from "@/components/MessagesPageBody";

export default async function ParentMessagesPage() {
  await requireRole("PARENT");
  return <MessagesPageBody />;
}
