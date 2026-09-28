import { StreakBadges } from "@/components/StreakBadges";

type StudentRow = {
  id: string;
  name: string;
  points: number;
  subLabel?: string;
  dailyStreak?: number;
  weeklyStreak?: number;
};

export function Leaderboard({ students, highlightId }: { students: StudentRow[]; highlightId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {students.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-foreground/50">لا يوجد طلاب بعد</div>
      )}
      {students.map((s, i) => (
        <div
          key={s.id}
          className={`flex items-center justify-between border-b border-border px-4 py-3 last:border-0 ${
            s.id === highlightId ? "bg-brand/5" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                i < 3 ? "bg-accent-gold/20 text-accent-gold" : "bg-background text-foreground/50"
              }`}
            >
              {i + 1}
            </span>
            <span className="font-medium">
              {s.name}
              {s.subLabel && <span className="ms-2 text-xs font-normal text-foreground/40">({s.subLabel})</span>}
            </span>
            <StreakBadges daily={s.dailyStreak ?? 0} weekly={s.weeklyStreak ?? 0} />
          </div>
          <span className="font-bold text-brand">{s.points}</span>
        </div>
      ))}
    </div>
  );
}
