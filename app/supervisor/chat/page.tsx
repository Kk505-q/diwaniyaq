import { requireRole } from "@/lib/guard";
import { ChatPageBody } from "@/components/ChatPageBody";

export default async function SupervisorChatPage() {
  await requireRole("SUPERVISOR");
  return <ChatPageBody />;
}
