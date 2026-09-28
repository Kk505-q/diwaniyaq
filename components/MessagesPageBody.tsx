import { getCurrentUser } from "@/lib/auth";
import { allowedRecipients } from "@/lib/messages";
import { getInbox, getUnreadMessageCount } from "@/lib/actions/messages";
import { MessagesPanel } from "@/components/MessagesPanel";

export async function MessagesPageBody() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [recipients, inbox, unread] = await Promise.all([
    allowedRecipients(user.id, user.role),
    getInbox(),
    getUnreadMessageCount(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">الرسائل</h2>
      <MessagesPanel recipients={recipients} inbox={inbox} unread={unread} />
    </div>
  );
}
