import "server-only";
import type { BillLineItem } from "@/lib/billing";

const BRAND_COLOR = "#385a7c";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-LK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function money(amountLKR: number): string {
  return `LKR ${amountLKR.toLocaleString()}`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 0;"><a href="${href}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;">${label}</a></p>`;
}

function layout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f7f5f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d5;">
            <tr>
              <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;font-weight:bold;">On It!</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2b2b2b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f7f5f0;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#8a8578;font-size:12px;">
                Sri Lanka's private concierge for beauty, wellness and everything in between.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail({
  name,
  isVendor,
}: {
  name: string;
  isVendor: boolean;
}): { subject: string; html: string } {
  if (isVendor) {
    return {
      subject: "Welcome to On It! — let's set up your salon",
      html: layout(
        `<p>Hi ${name},</p>
         <p>Welcome to On It! Your vendor account is ready — next, set up your salon profile so customers can start booking with you.</p>
         ${button(`${APP_URL}/vendor/setup`, "Set up your salon")}`
      ),
    };
  }
  return {
    subject: "Welcome to On It!",
    html: layout(
      `<p>Hi ${name},</p>
       <p>Welcome to On It! You're all set to browse salons across Colombo and book real-time appointments — no calls, no waiting.</p>
       ${button(`${APP_URL}/beauty/salons`, "Browse salons")}`
    ),
  };
}

export function bookingConfirmationEmail({
  customerName,
  salonName,
  serviceName,
  date,
  time,
  priceLKR,
}: {
  customerName: string;
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
  priceLKR: number;
}): { subject: string; html: string } {
  const rows: [string, string][] = [
    ["Salon", salonName],
    ["Service", serviceName],
    ["Date", formatDate(date)],
    ["Time", time],
  ];
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#8a8578;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  return {
    subject: `Booking confirmed — ${salonName}`,
    html: layout(
      `<p>Hi ${customerName},</p>
       <p>Your appointment is confirmed:</p>
       <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
         ${rowsHtml}
         <tr><td style="padding:10px 0 0;color:#8a8578;border-top:1px solid #e5e0d5;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #e5e0d5;">${money(priceLKR)}</td></tr>
       </table>
       ${button(`${APP_URL}/bookings`, "View your booking")}`
    ),
  };
}

export function cancellationEmail({
  customerName,
  salonName,
  serviceName,
  date,
  time,
  cancellationFeeLKR,
}: {
  customerName: string;
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
  cancellationFeeLKR: number | null;
}): { subject: string; html: string } {
  const rows: [string, string][] = [
    ["Salon", salonName],
    ["Service", serviceName],
    ["Date", formatDate(date)],
    ["Time", time],
  ];
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#8a8578;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  return {
    subject: `Booking cancelled — ${salonName}`,
    html: layout(
      `<p>Hi ${customerName},</p>
       <p>Your appointment has been cancelled:</p>
       <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
         ${rowsHtml}
       </table>
       ${
         cancellationFeeLKR
           ? `<p>A cancellation fee of ${money(cancellationFeeLKR)} applies, payable at the salon on your next visit.</p>`
           : ""
       }
       ${button(`${APP_URL}/beauty/salons`, "Book another appointment")}`
    ),
  };
}

export function newBookingVendorEmail({
  vendorName,
  salonName,
  customerName,
  customerPhone,
  serviceName,
  date,
  time,
  priceLKR,
}: {
  vendorName: string;
  salonName: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  time: string;
  priceLKR: number;
}): { subject: string; html: string } {
  const rows: [string, string][] = [
    ["Customer", customerName],
    ["Phone", customerPhone],
    ["Service", serviceName],
    ["Date", formatDate(date)],
    ["Time", time],
  ];
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#8a8578;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  return {
    subject: `New booking — ${salonName}`,
    html: layout(
      `<p>Hi ${vendorName},</p>
       <p>You've got a new booking at ${salonName}:</p>
       <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
         ${rowsHtml}
         <tr><td style="padding:10px 0 0;color:#8a8578;border-top:1px solid #e5e0d5;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #e5e0d5;">${money(priceLKR)}</td></tr>
       </table>
       ${button(`${APP_URL}/vendor/dashboard`, "View your dashboard")}`
    ),
  };
}

export function billEmail({
  customerName,
  salonName,
  serviceLabel,
  lineItems,
  totalLKR,
}: {
  customerName: string;
  salonName: string;
  serviceLabel: string;
  lineItems: BillLineItem[];
  totalLKR: number;
}): { subject: string; html: string } {
  const rowsHtml = lineItems
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;">${item.label}</td><td style="padding:4px 0;text-align:right;">${money(item.amountLKR)}</td></tr>`
    )
    .join("");

  return {
    subject: `Your bill from ${salonName}`,
    html: layout(
      `<p>Hi ${customerName},</p>
       <p>Here's your bill from ${salonName} for ${serviceLabel}:</p>
       <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
         ${rowsHtml}
         <tr><td style="padding:10px 0 0;font-weight:700;border-top:1px solid #e5e0d5;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #e5e0d5;">${money(totalLKR)}</td></tr>
       </table>
       <p>Thank you for choosing On It!</p>`
    ),
  };
}
