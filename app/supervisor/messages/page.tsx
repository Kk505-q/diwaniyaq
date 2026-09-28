import { requireRole } from "@/lib/guard";
import { MessagesPageBody } from "@/components/MessagesPageBody";

export default async function SupervisorMessagesPage() {
  await requireRole("SUPERVISOR");
  return <MessagesPageBody />;
}
