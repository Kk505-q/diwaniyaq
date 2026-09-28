import { requireRole } from "@/lib/guard";
import { ChatPageBody } from "@/components/ChatPageBody";

export default async function StudentChatPage() {
  await requireRole("STUDENT");
  return <ChatPageBody />;
}
