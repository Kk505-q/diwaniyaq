function colorFor(percent: number): string {
  if (percent >= 80) return "text-success";
  if (percent >= 50) return "text-accent-gold";
  return "text-danger";
}

function barColorFor(_percent: number): string {
  // Progress bar is always the brand blue.
  return "bg-brand";
}

// Compact inline percentage (for table cells).
export function CompletionBadge({ percent }: { percent: number }) {
  return <span className={`font-bold ${colorFor(percent)}`}>{percent}%</span>;
}

// Labelled progress bar (for cards / dashboards).
export function CompletionBar({
  percent,
  label = "نسبة الإنجاز الأسبوعية",
}: {
  percent: number;
  label?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground/60">{label}</span>
        <span className={`font-bold ${colorFor(percent)}`}>{percent}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${barColorFor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
