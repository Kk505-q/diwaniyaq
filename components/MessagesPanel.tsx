"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { sendMessageAction, markMessagesRead } from "@/lib/actions/messages";
import type { MessageActionState, InboxItem } from "@/lib/actions/messages";
import type { Recipient } from "@/lib/messages";

const initial: MessageActionState = {};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function SendButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "جارٍ الإرسال..." : label}
    </button>
  );
}

export function MessagesPanel({
  recipients,
  inbox,
  unread,
}: {
  recipients: Recipient[];
  inbox: InboxItem[];
  unread: number;
}) {
  const [tab, setTab] = useState<"send" | "inbox">(unread > 0 ? "inbox" : "send");
  const router = useRouter();

  // Mark everything read the first time the inbox tab is shown.
  const markedRef = useRef(false);
  useEffect(() => {
    if (tab === "inbox" && unread > 0 && !markedRef.current) {
      markedRef.current = true;
      markMessagesRead().then(() => router.refresh());
    }
  }, [tab, unread, router]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => setTab("send")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === "send" ? "bg-brand text-white" : "text-foreground/60 hover:text-foreground"
          }`}
        >
          إرسال رسالة
        </button>
        <button
          onClick={() => setTab("inbox")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === "inbox" ? "bg-brand text-white" : "text-foreground/60 hover:text-foreground"
          }`}
        >
          الرسائل الواردة
          {unread > 0 && (
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs text-white">
              {unread}
            </span>
          )}
        </button>
      </div>

      {tab === "send" ? <ComposeForm recipients={recipients} /> : <Inbox inbox={inbox} />}
    </div>
  );
}

function ComposeForm({ recipients }: { recipients: Recipient[] }) {
  const [state, formAction] = useActionState(sendMessageAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  if (recipients.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground/60">
        لا يوجد أشخاص يمكنك مراسلتهم حاليًا.
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-success">تم إرسال الرسالة بنجاح ✅</p>}

      <div className="space-y-1">
        <label className="text-sm font-semibold">إلى</label>
        <select
          name="recipientId"
          defaultValue=""
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            اختر المستلم...
          </option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.roleLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">نص الرسالة</label>
        <textarea
          name="body"
          required
          rows={5}
          maxLength={2000}
          placeholder="اكتب رسالتك هنا..."
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <SendButton label="إرسال" />
    </form>
  );
}

function Inbox({ inbox }: { inbox: InboxItem[] }) {
  if (inbox.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground/60">
        لا توجد رسائل واردة.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inbox.map((m) => (
        <MessageCard key={m.id} m={m} />
      ))}
    </div>
  );
}

function MessageCard({ m }: { m: InboxItem }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(sendMessageAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold">{m.senderName}</span>
          <span className="ms-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
            {m.senderRoleLabel}
          </span>
        </div>
        <span className="shrink-0 text-xs text-foreground/40">{formatTime(m.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{m.body}</p>

      <button onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-bold text-brand hover:underline">
        {open ? "إلغاء" : "رد"}
      </button>

      {open && (
        <form ref={formRef} action={formAction} className="mt-3 space-y-2">
          <input type="hidden" name="recipientId" value={m.senderId} />
          {state.error && <p className="text-xs text-danger">{state.error}</p>}
          <textarea
            name="body"
            required
            rows={3}
            maxLength={2000}
            placeholder={`رد على ${m.senderName}...`}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <SendButton label="إرسال الرد" />
        </form>
      )}
    </div>
  );
}
