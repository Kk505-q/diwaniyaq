"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getChat,
  sendChatMessageAction,
  editChatMessageAction,
  deleteChatMessageAction,
  setChatOpenAction,
  type ChatMessageItem,
  type ChatState,
} from "@/lib/actions/chat";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "numeric",
    minute: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

type ReplyTarget = { id: string; authorName: string; body: string };
type EditTarget = { id: string };

export function ChatRoom({
  initialMessages,
  initialState,
}: {
  initialMessages: ChatMessageItem[];
  initialState: ChatState;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, setState] = useState(initialState);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const data = await getChat();
    if (data) {
      setMessages(data.messages);
      setState(data.state);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(load, 7000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startReply(m: ChatMessageItem) {
    setEditing(null);
    setReplyingTo({ id: m.id, authorName: m.authorName, body: m.body });
    inputRef.current?.focus();
  }

  function startEdit(m: ChatMessageItem) {
    setReplyingTo(null);
    setEditing({ id: m.id });
    setInput(m.body);
    inputRef.current?.focus();
  }

  function cancelMode() {
    setEditing(null);
    setReplyingTo(null);
    setInput("");
    setError("");
  }

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    const res = editing
      ? await editChatMessageAction(editing.id, text)
      : await sendChatMessageAction(text, replyingTo?.id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setInput("");
    setEditing(null);
    setReplyingTo(null);
    await load();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function remove(id: string) {
    await deleteChatMessageAction(id);
    if (editing?.id === id) cancelMode();
    await load();
  }

  async function toggleOpen() {
    await setChatOpenAction(!state.open);
    await load();
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold">الشات العام</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              state.open ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {state.open ? "مفتوح" : "مغلق"}
          </span>
        </div>
        {state.canModerate && (
          <button
            onClick={toggleOpen}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-background"
          >
            {state.open ? "إغلاق الشات" : "فتح الشات"}
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground/50">لا توجد رسائل بعد. كن أول من يكتب!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-2xl border border-border bg-background px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{m.authorName}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    m.isStaff ? "bg-brand/10 text-brand" : "bg-foreground/10 text-foreground/60"
                  }`}
                >
                  {m.roleLabel}
                </span>
                <span className="text-[10px] text-foreground/40">{formatTime(m.createdAt)}</span>
                {m.edited && <span className="text-[10px] text-foreground/40">(معدّلة)</span>}
              </div>
              {m.replyTo && (
                <div className="mt-1 border-s-2 border-brand/40 bg-brand/5 px-2 py-1 text-xs text-foreground/60">
                  <span className="font-bold">↩ {m.replyTo.authorName}: </span>
                  {m.replyTo.body}
                </div>
              )}
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/80">{m.body}</p>
            </div>
            <div className="mt-1 flex gap-3 text-[11px]">
              <button onClick={() => startReply(m)} className="text-brand hover:underline">
                رد
              </button>
              {m.canEdit && (
                <button onClick={() => startEdit(m)} className="text-foreground/60 hover:underline">
                  تعديل
                </button>
              )}
              {m.canDelete && (
                <button onClick={() => remove(m.id)} className="text-danger hover:underline">
                  حذف
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {error && <p className="mb-2 text-xs text-danger">{error}</p>}

        {editing && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-accent-gold/10 px-3 py-1.5 text-xs">
            <span className="font-bold text-accent-gold">تعديل الرسالة</span>
            <button onClick={cancelMode} className="text-foreground/60 hover:underline">
              إلغاء
            </button>
          </div>
        )}
        {replyingTo && !editing && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-brand/5 px-3 py-1.5 text-xs">
            <span className="truncate text-foreground/70">
              <span className="font-bold text-brand">↩ ردًا على {replyingTo.authorName}: </span>
              {replyingTo.body.slice(0, 60)}
            </span>
            <button onClick={cancelMode} className="ms-2 shrink-0 text-foreground/60 hover:underline">
              إلغاء
            </button>
          </div>
        )}

        {state.canPost || editing ? (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder={editing ? "عدّل رسالتك..." : "اكتب رسالتك..."}
              className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={submit}
              disabled={busy || !input.trim()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {editing ? "حفظ" : "إرسال"}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-foreground/50">الشات مغلق حاليًا من قبل الإدارة.</p>
        )}
      </div>
    </div>
  );
}
