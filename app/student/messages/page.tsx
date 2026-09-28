import { requireRole } from "@/lib/guard";
import { MessagesPageBody } from "@/components/MessagesPageBody";

export default async function StudentMessagesPage() {
  await requireRole("STUDENT");
  return <MessagesPageBody />;
}
