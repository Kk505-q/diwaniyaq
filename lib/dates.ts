// All habit periods are computed in Saudi Arabia local time (UTC+3, no DST),
// so a "day" runs 12:00 AM → 11:59 PM Riyadh time regardless of server timezone.
const KSA_OFFSET_MS = 3 * 60 * 60 * 1000;

// A Date shifted so its UTC calendar parts equal the Riyadh wall-clock parts.
function ksa(date: Date): Date {
  return new Date(date.getTime() + KSA_OFFSET_MS);
}

export function dailyPeriodKey(date: Date = new Date()): string {
  const d = ksa(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weeklyPeriodKey(date: Date = new Date()): string {
  // ISO week number (Monday-start week) of the Riyadh-local date.
  const s = ksa(date);
  const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function periodKeyFor(frequency: "DAILY" | "WEEKLY", date: Date = new Date()): string {
  return frequency === "DAILY" ? dailyPeriodKey(date) : weeklyPeriodKey(date);
}

// The seven daily period keys (Mon..Sun) of the Riyadh week that `date` falls in.
export function currentWeekDailyKeys(date: Date = new Date()): string[] {
  const s = ksa(date);
  const base = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const dow = base.getUTCDay() || 7; // Mon=1 .. Sun=7
  base.setUTCDate(base.getUTCDate() - (dow - 1));
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

export function formatArabicDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}
