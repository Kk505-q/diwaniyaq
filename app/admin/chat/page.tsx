import { requireRole } from "@/lib/guard";
import { ChatPageBody } from "@/components/ChatPageBody";

export default async function AdminChatPage() {
  await requireRole("ADMIN");
  return <ChatPageBody />;
}
