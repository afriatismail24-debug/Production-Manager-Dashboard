import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export async function sendPasswordReset(
  to: string,
  code: string,
  bossName: string,
): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"ChefTrack" <${SMTP_FROM}>`,
    to,
    subject: "ChefTrack — Password Reset Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Hi ${bossName},</h2>
        <p>Your password reset code is:</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#f97316">${code}</span>
        </div>
        <p style="color:#64748b;font-size:13px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
        <p style="color:#94a3b8;font-size:11px">ChefTrack — Production Tracker</p>
      </div>`,
  });

  return true;
}
