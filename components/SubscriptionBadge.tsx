import { SUBSCRIPTION_LABEL, SUBSCRIPTION_COLOR } from "@/lib/labels";

// Read-only subscription status shown to the student.
export function SubscriptionBadge({ status }: { status: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-sm font-medium text-foreground/70">حالة الاشتراك</span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${SUBSCRIPTION_COLOR[status]}`}>
        {SUBSCRIPTION_LABEL[status]}
      </span>
    </div>
  );
}
