import "server-only";
import nodemailer from "nodemailer";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "";
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD ?? "";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!EMAIL_FROM || !EMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_FROM, pass: EMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

// Delivery is best-effort: a slow/failed send should never break the signup,
// booking, or billing flow that triggered it, so failures are caught and
// logged here rather than thrown.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    console.warn(`[email] Not configured — skipped "${subject}" to ${to}`);
    return false;
  }
  try {
    await client.sendMail({ from: `"On It!" <${EMAIL_FROM}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}
