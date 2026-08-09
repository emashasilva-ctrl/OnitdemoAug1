import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { welcomeEmail } from "@/lib/email-templates";

// Temporary diagnostic endpoint — inspect a user record on production to
// debug the "no welcome email on Google sign-in" report. Delete after use.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-debug-secret");
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "missing email param" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      googleId: true,
      facebookId: true,
      passwordHash: true,
      isVendor: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}

// Sends a real test email and reports the actual nodemailer error (sendEmail
// swallows it and only console.errors), to see whether Gmail SMTP delivery
// itself is the reason the Google-sign-in welcome email never arrived.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-debug-secret");
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const to = request.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "missing to param" }, { status: 400 });
  const resendWelcome = request.nextUrl.searchParams.get("resendWelcome") === "1";

  const EMAIL_FROM = process.env.EMAIL_FROM ?? "";
  const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD ?? "";
  if (!EMAIL_FROM || !EMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: false, reason: "EMAIL_FROM or EMAIL_APP_PASSWORD not set" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_FROM, pass: EMAIL_APP_PASSWORD },
  });

  let subject = "On It! debug test email";
  let html = "<p>Test email from the debug route.</p>";
  if (resendWelcome) {
    const user = await prisma.user.findUnique({ where: { email: to }, select: { name: true, isVendor: true } });
    if (!user) return NextResponse.json({ ok: false, reason: "no user with that email" });
    ({ subject, html } = welcomeEmail({ name: user.name, isVendor: user.isVendor }));
  }

  const start = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"On It!" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    return NextResponse.json({ ok: true, ms: Date.now() - start, messageId: info.messageId, response: info.response });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
