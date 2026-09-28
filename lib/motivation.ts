import { prisma } from "@/lib/db";
import { taskProgress } from "@/lib/progress";
import { randomPhrase } from "@/lib/phrases";
import { isEmailConfigured, sendMail } from "@/lib/email";

// Daily emails (Riyadh time): motivational summary at 8:00 PM and a reminder
// with a login link at 9:30 PM.
const MOTIVATION_AT_MIN = 20 * 60; // 8:00 PM
const REMINDER_AT_MIN = 21 * 60 + 30; // 9:30 PM

function ksaParts() {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  return { date, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function emailHtml(name: string, percent: number, remaining: number, total: number, phrase: string) {
  const link = "https://www.sanaatalqada.com/login";
  const firstName = name.trim().split(/\s+/)[0] || name;
  const remainingLine =
    total > 0
      ? remaining > 0
        ? `<p style="margin:6px 0;color:#334155">بقي لك <strong>${remaining}</strong> من <strong>${total}</strong> مهام اليوم.</p>`
        : `<p style="margin:6px 0;color:#16a34a">أنجزت كل مهام اليوم 🎉</p>`
      : "";
  return `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#10172a;max-width:520px;margin:auto">
      <div style="background:#004EAB;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0">
        <h2 style="margin:0;font-size:18px">السلام عليكم يا ${firstName}</h2>
        <div style="margin-top:6px;font-size:22px;font-weight:bold">${percent}%</div>
        <div style="font-size:12px;opacity:.85">نسبة إنجازك اليوم</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:20px 22px">
        <p style="margin:0 0 10px;font-size:15px;line-height:1.8">${phrase}</p>
        ${remainingLine}
        <p style="margin:18px 0 0">
          <a href="${link}" style="background:#004EAB;color:#fff;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:bold">افتح مهامك</a>
        </p>
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:10px">ديوانية ق — متابعة العادات اليومية</p>
    </div>`;
}

// Called from the keep-alive ping. Sends at most once per day, after the target
// hour, to every student who has an email address.
export async function maybeSendDailyMotivation() {
  if (!isEmailConfigured()) return;

  const { date, minutes } = ksaParts();
  if (minutes < MOTIVATION_AT_MIN) return;

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (settings?.motivationEmailDate === date) return; // already sent today

  // Claim today's slot first to avoid duplicate sends from concurrent pings.
  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", motivationEmailDate: date },
    update: { motivationEmailDate: date },
  });

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });

  for (const s of students) {
    if (!s.email) continue;
    try {
      const p = await taskProgress(s.id);
      const phrase = randomPhrase(p.percent);
      await sendMail(s.email, "رسالتك اليومية — ديوانية ق", emailHtml(s.name, p.percent, p.remaining, p.total, phrase));
    } catch (e) {
      console.error("motivation email failed for", s.id, e);
    }
  }
}

function reminderHtml(name: string, remaining: number, total: number) {
  const link = "https://www.sanaatalqada.com/login";
  const firstName = name.trim().split(/\s+/)[0] || name;
  const line =
    total > 0 && remaining > 0
      ? `<p style="margin:6px 0;color:#334155">بقي لك <strong>${remaining}</strong> من <strong>${total}</strong> مهام اليوم قبل منتصف الليل.</p>`
      : total > 0
        ? `<p style="margin:6px 0;color:#16a34a">أنجزت كل مهام اليوم 🎉 بارك الله فيك.</p>`
        : "";
  return `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#10172a;max-width:520px;margin:auto">
      <div style="background:linear-gradient(90deg,#1e4fd6,#14329b);color:#fff;padding:18px 22px;border-radius:14px 14px 0 0">
        <h2 style="margin:0;font-size:18px">ديوانية ق — تذكير يومي</h2>
        <div style="font-size:12px;opacity:.85;margin-top:4px">أكاديمية ق</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:20px 22px">
        <p style="margin:0 0 8px;font-size:15px">السلام عليكم يا ${firstName} 🌙</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.8">تذكير بمهامك اليومية — لا تفوّت أجرها ونقاطها.</p>
        ${line}
        <p style="margin:18px 0 0">
          <a href="${link}" style="background:#1e4fd6;color:#fff;padding:11px 24px;border-radius:10px;text-decoration:none;font-weight:bold">سجّل الدخول وأكمل مهامك</a>
        </p>
        <p style="margin:14px 0 0;font-size:12px;color:#94a3b8">أو افتح الرابط: ${link}</p>
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:10px">ديوانية ق — متابعة العادات اليومية</p>
    </div>`;
}

// Daily reminder email (with a direct login link) — sent once per day at 9:30 PM.
export async function maybeSendDailyReminder() {
  if (!isEmailConfigured()) return;

  const { date, minutes } = ksaParts();
  if (minutes < REMINDER_AT_MIN) return;

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (settings?.reminderEmailDate === date) return;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", reminderEmailDate: date },
    update: { reminderEmailDate: date },
  });

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });

  for (const s of students) {
    if (!s.email) continue;
    try {
      const p = await taskProgress(s.id);
      await sendMail(s.email, "تذكير يومي — ديوانية ق", reminderHtml(s.name, p.remaining, p.total));
    } catch (e) {
      console.error("reminder email failed for", s.id, e);
    }
  }
}
