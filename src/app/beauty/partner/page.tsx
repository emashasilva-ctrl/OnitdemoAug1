import type { Metadata } from "next";
import { CalendarCheck, TrendingUp, Wallet, BadgeCheck } from "lucide-react";
import { PartnerForm } from "@/components/beauty/partner-form";

export const metadata: Metadata = {
  title: "List Your Salon",
  description:
    "Partner with On It! to fill empty chairs with instant bookings from customers across Colombo.",
};

const benefits = [
  {
    icon: CalendarCheck,
    title: "Fill empty chairs",
    body: "Customers book directly into your real-time schedule, any time of day.",
  },
  {
    icon: Wallet,
    title: "No booking fees",
    body: "Customers pay you directly at the salon — On It! doesn't take a cut of your sales.",
  },
  {
    icon: TrendingUp,
    title: "Reach new customers",
    body: "Get discovered by people searching for your services across Colombo.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    body: "Every partner salon is visited and verified, building trust with new customers.",
  },
];

export default function PartnerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-5xl">
          Own a salon in Colombo?
        </h1>
        <p className="mt-4 text-lg text-balance text-muted-foreground">
          Join On It! for free and start taking instant bookings from
          customers across the city.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <b.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-foreground">{b.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{b.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <h2 className="mb-6 text-center font-heading text-2xl font-semibold text-foreground">
          Request to join
        </h2>
        <PartnerForm />
      </div>
    </div>
  );
}
