import type { Metadata } from "next";
import Link from "next/link";
import { Search, CalendarCheck, ShieldCheck, ArrowRight, Clock, Wallet } from "lucide-react";
import { HeroSearch } from "@/components/dining/hero-search";
import { RestaurantCard } from "@/components/restaurant-card";
import { CategoryIcon } from "@/components/category-icon";
import {
  DoodleChili,
  DoodleCoffee,
  DoodleFork,
  DoodleLeaf,
  DoodleSparkle,
} from "@/components/doodles";
import { Marquee } from "@/components/marquee";
import { PhotoCarousel } from "@/components/photo-carousel";
import { Button } from "@/components/ui/button";
import { cuisines } from "@/lib/data/cuisines";
import { diningPhotos } from "@/lib/carousel-photos";
import { getAllRestaurants, getFeaturedRestaurants } from "@/lib/data/restaurants";

export const metadata: Metadata = {
  title: "Dining — Reserve Colombo's best tables, instantly",
  description:
    "Browse trusted Colombo restaurants, check real-time table availability, and reserve instantly with a card on file.",
};

const TICKER_ITEMS = ["Real-Time Tables", "Card On File", "No-Show Protected", "Cuisines Across Colombo"];

export default async function DiningLandingPage() {
  const [featured, allRestaurants] = await Promise.all([
    getFeaturedRestaurants(),
    getAllRestaurants(),
  ]);
  const areas = Array.from(new Set(allRestaurants.map((r) => r.area))).sort();

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[820px] flex-col overflow-hidden">
        <PhotoCarousel photos={diningPhotos} />
        <Marquee items={TICKER_ITEMS} />

        <DoodleFork className="pointer-events-none absolute left-[5%] top-24 z-10 hidden size-12 -rotate-6 text-lime sm:block" />
        <DoodleChili className="pointer-events-none absolute bottom-28 left-[4%] z-10 hidden size-11 rotate-6 text-sky sm:block" />
        <DoodleCoffee className="pointer-events-none absolute right-[6%] top-24 z-10 hidden size-11 -rotate-3 text-sky sm:block" />
        <DoodleLeaf className="pointer-events-none absolute right-[12%] bottom-40 z-10 hidden size-10 rotate-6 text-lime sm:block" />
        <DoodleSparkle className="pointer-events-none absolute right-[3%] top-60 z-10 hidden size-7 text-lime sm:block" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-6">
          <h1 className="max-w-3xl text-balance font-display-black text-4xl leading-[0.98] tracking-tight text-white uppercase sm:text-6xl">
            Reserve Colombo&apos;s
            <br />
            Best Tables<span className="text-primary">.</span>
            <br />
            Instantly.
          </h1>
          <p className="max-w-xl text-balance text-lg text-white/85">
            Real-time table availability at restaurants across the city. Pick a
            time, pick a party size — a card on file holds your table.
          </p>

          <div className="w-full max-w-2xl">
            <HeroSearch areas={areas} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {cuisines.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`/dining/restaurants?cuisine=${c.slug}`}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {c.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cuisines */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                Browse by cuisine
                <DoodleSparkle className="size-5 text-primary/60" />
              </h2>
              <p className="mt-1 text-muted-foreground">
                One reservation flow, every kind of table.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cuisines.map((c) => (
              <Link
                key={c.slug}
                href={`/dining/restaurants?cuisine=${c.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span>
                  <span className="block font-heading text-base font-semibold text-foreground">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {c.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured restaurants */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
              Featured restaurants
            </h2>
            <p className="mt-1 text-muted-foreground">
              Highly rated, ready to reserve today.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden shrink-0 sm:inline-flex">
            <Link href="/dining/restaurants">
              View all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>

        <Button variant="outline" asChild className="mt-8 w-full sm:hidden">
          <Link href="/dining/restaurants">
            View all restaurants
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
              How On It! Dining works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Three steps, no phone calls required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Browse & choose",
                body: "Compare restaurants by cuisine, area and rating.",
              },
              {
                icon: CalendarCheck,
                title: "Reserve a real table",
                body: "See live availability and book the exact time that suits you.",
              },
              {
                icon: ShieldCheck,
                title: "Show up, card on file",
                body: "No charge unless you don't show — your table is simply held.",
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

      {/* Trust bar */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {allRestaurants.length} vetted restaurants
              </p>
              <p className="text-sm text-muted-foreground">
                Every partner restaurant is visited and verified before joining.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
            <Clock className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                Live table availability
              </p>
              <p className="text-sm text-muted-foreground">
                Reserved instantly against the restaurant&apos;s real schedule.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
            <Wallet className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                No charge unless no-show
              </p>
              <p className="text-sm text-muted-foreground">
                Your card just holds the table — pay the restaurant directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-foreground px-6 py-12 text-center sm:px-16">
          <h2 className="max-w-md font-heading text-2xl font-semibold text-balance text-background sm:text-3xl">
            Own a restaurant in Colombo?
          </h2>
          <p className="max-w-md text-balance text-background/70">
            List with On It! for free and start filling tables with instant,
            no-show-protected reservations.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-1">
            <Link href="/dining/partner">
              List Your Restaurant
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
