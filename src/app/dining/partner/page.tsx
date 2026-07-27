import type { Metadata } from "next";
import { CalendarCheck, TrendingUp, ShieldCheck, BadgeCheck } from "lucide-react";
import { PartnerForm } from "@/components/dining/partner-form";

export const metadata: Metadata = {
  title: "List Your Restaurant",
  description:
    "Partner with On It! to fill tables with instant, no-show-protected reservations from customers across Colombo.",
};

const benefits = [
  {
    icon: CalendarCheck,
    title: "Fill more tables",
    body: "Guests reserve directly into your real-time schedule, any time of day.",
  },
  {
    icon: ShieldCheck,
    title: "No-show protection",
    body: "Every reservation holds a card on file, so empty tables cost you less.",
  },
  {
    icon: TrendingUp,
    title: "Reach new diners",
    body: "Get discovered by people searching for your cuisine across Colombo.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    body: "Every partner restaurant is visited and verified, building trust with new diners.",
  },
];

export default function DiningPartnerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-5xl">
          Own a restaurant in Colombo?
        </h1>
        <p className="mt-4 text-lg text-balance text-muted-foreground">
          Join On It! for free and start taking instant, protected
          reservations from diners across the city.
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
