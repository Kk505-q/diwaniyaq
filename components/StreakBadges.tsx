// Shows a student's streaks: 🔥 for consecutive days of completed daily tasks,
// ⭐ for consecutive weeks of completed weekly tasks.
export function StreakBadges({
  daily,
  weekly,
  className = "",
}: {
  daily: number;
  weekly: number;
  className?: string;
}) {
  if (daily <= 0 && weekly <= 0) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {daily > 0 && (
        <span
          title={`${daily} يوم متتالٍ من إنجاز المهام اليومية`}
          className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-600"
        >
          <span aria-hidden>🔥</span>
          {daily}
        </span>
      )}
      {weekly > 0 && (
        <span
          title={`${weekly} أسبوع متتالٍ من إنجاز المهام الأسبوعية`}
          className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-600"
        >
          <span aria-hidden>⭐</span>
          {weekly}
        </span>
      )}
    </span>
  );
}
