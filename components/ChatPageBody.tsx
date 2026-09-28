import { getChat } from "@/lib/actions/chat";
import { ChatRoom } from "@/components/ChatRoom";

export async function ChatPageBody() {
  const data = await getChat();
  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground/60">
        لا تملك صلاحية الوصول للشات.
      </div>
    );
  }
  return <ChatRoom initialMessages={data.messages} initialState={data.state} />;
}
