import nodemailer from "nodemailer";

// Sends mail through Gmail SMTP using an App Password.
// Requires GMAIL_USER and GMAIL_APP_PASSWORD in the environment.
export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail(to: string, subject: string, html: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Email not configured (missing GMAIL_USER / GMAIL_APP_PASSWORD)");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"ديوانية ق" <${user}>`,
    to,
    subject,
    html,
  });
}
