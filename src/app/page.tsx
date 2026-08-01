import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  DoodleLeaf,
  DoodlePalm,
  DoodleSparkle,
  DoodleSwirl,
  DoodleWave,
} from "@/components/doodles";
import { Marquee } from "@/components/marquee";
import { PhotoCarousel } from "@/components/photo-carousel";
import { Button } from "@/components/ui/button";
import { homePhotos } from "@/lib/carousel-photos";

const TICKER_ITEMS = [
  "Real-Time Booking",
  "Salons Across Colombo",
  "No Booking Fees",
  "Book In Seconds",
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[820px] flex-col overflow-hidden">
        <PhotoCarousel photos={homePhotos} />
        <Marquee items={TICKER_ITEMS} />

        <DoodleLeaf className="pointer-events-none absolute left-[6%] top-24 z-10 hidden size-12 -rotate-8 text-lime sm:block" />
        <DoodlePalm className="pointer-events-none absolute bottom-24 left-[4%] z-10 hidden size-16 rotate-3 text-sky sm:block" />
        <DoodleWave className="pointer-events-none absolute right-[8%] top-60 z-10 hidden size-20 text-lime sm:block" />
        <DoodleSparkle className="pointer-events-none absolute right-[7%] top-24 z-10 hidden size-9 rotate-6 text-sky sm:block" />
        <DoodleSparkle className="pointer-events-none absolute right-[13%] bottom-32 z-10 hidden size-6 text-lime sm:block" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-6">
          <h1 className="max-w-3xl text-balance font-display-black text-4xl leading-[0.98] tracking-tight text-white uppercase sm:text-6xl lg:text-7xl">
            Colombo&apos;s
            <br />
            Concierge<span className="text-primary">.</span>
            <br />
            On Demand.
          </h1>
          <p className="max-w-md text-balance text-lg text-white/85">
            One account, real-time booking for the best salons across the
            city.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/beauty"
              className="rounded-full bg-primary px-7 py-4 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-transform hover:scale-[1.03]"
            >
              Explore Beauty
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="flex items-center justify-center gap-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
              How On It! works
              <DoodleSparkle className="size-5 text-primary/60" />
            </h2>
            <p className="mt-2 text-muted-foreground">
              Booking a salon in Colombo, made simple.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Browse salons",
                body: "Explore the best salons across Colombo, all in one place.",
              },
              {
                icon: CalendarCheck,
                title: "Book in real time",
                body: "See live availability and reserve the exact slot that suits you.",
              },
              {
                icon: ShieldCheck,
                title: "Show up",
                body: "Pay at the salon — no booking fees, no card on file.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </span>
                <span className="absolute top-6 right-6 font-heading text-2xl font-semibold text-muted-foreground/30">
                  {i + 1}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-foreground px-6 py-12 text-center sm:px-16">
          <DoodleSwirl className="size-16 text-background/40" />
          <h2 className="max-w-md font-heading text-2xl font-semibold text-balance text-background sm:text-3xl">
            Own a salon in Colombo?
          </h2>
          <p className="max-w-md text-balance text-background/70">
            List with On It! for free and start taking real-time bookings.
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/beauty/partner">
                List Your Salon
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
