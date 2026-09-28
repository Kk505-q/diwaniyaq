import { formatArabicDate } from "@/lib/dates";

function hijriDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Riyadh",
    }).format(d);
  } catch {
    return "";
  }
}

// Greeting card with a circular progress ring and a motivational message.
export function WelcomeCard({
  name,
  percent,
  remaining,
  total,
  phrase,
}: {
  name: string;
  percent: number;
  remaining: number;
  total: number;
  phrase: string;
}) {
  const firstName = name.trim().split(/\s+/)[0] || name;
  const now = new Date();
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - Math.max(0, Math.min(100, percent)) / 100);
  const hijri = hijriDate(now);

  return (
    <div className="rounded-2xl bg-gradient-to-l from-brand to-brand-dark p-5 text-white sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold sm:text-xl">السلام عليكم يا {firstName}</h2>
          <p className="mt-1 text-xs text-white/70">
            {formatArabicDate(now)}
            {hijri && <span> • {hijri}</span>}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/90">{phrase}</p>
          {total > 0 && (
            <p className="mt-2 text-xs font-medium text-white/70">
              {remaining > 0 ? `بقي لك ${remaining} من ${total} مهام` : "أنجزت كل مهام اليوم 🎉"}
            </p>
          )}
        </div>

        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="8" className="stroke-current text-white/20" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              className="stroke-current text-white transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
            {percent}%
          </div>
        </div>
      </div>
    </div>
  );
}
