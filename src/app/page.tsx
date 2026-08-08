import Link from "next/link";
import { VideoCarousel } from "@/components/home/video-carousel";
import { HeroSearch } from "@/components/home/hero-search";
import { QuickServicesGrid } from "@/components/home/quick-services-grid";
import { getAllSalons, getCategoryStartingPrices } from "@/lib/data/salons";

// See src/app/sitemap.ts for why: build-time prerendering has no reliable
// access to the Turso env vars, so this needs to run per-request instead.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [salons, prices] = await Promise.all([
    getAllSalons(),
    getCategoryStartingPrices(),
  ]);
  const areas = Array.from(new Set(salons.map((s) => s.area))).sort();

  return (
    <>
      <VideoCarousel>
        <div className="text-center">
          <span className="mb-10 block text-[13px] tracking-[0.5em] text-sand/90 uppercase">
            Consider it done
          </span>
          <h1
            className="mx-auto mb-10 max-w-[1000px] text-balance font-cormorant text-[clamp(58px,8.4vw,128px)] leading-[1.04] text-sand italic"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,.35)" }}
          >
            Whatever you need, <span className="not-italic">we&apos;re on it</span>
          </h1>
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 flex-none bg-sand/50" />
            <p
              className="max-w-[520px] font-jost text-[19px] leading-[1.5] text-sand/95"
              style={{ textShadow: "0 1px 15px rgba(0,0,0,.3)" }}
            >
              Beauty, wellness and lifestyle services, arranged around your day.
            </p>
            <div className="h-px w-16 flex-none bg-sand/50" />
          </div>

          <HeroSearch areas={areas} />
        </div>
      </VideoCarousel>

      <QuickServicesGrid prices={prices} />

      <section id="how" className="border-b border-teal px-8 py-22">
        <div className="mx-auto max-w-[1280px]">
          <span className="mb-11 block text-[10px] tracking-[0.26em] text-deep-blue uppercase">
            How it works
          </span>
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Browse salons",
                body: "Explore the island's best salons and studios, gathered in one place with the details that actually matter.",
              },
              {
                n: "02",
                title: "Book in real time",
                body: "See live availability and hold the exact slot that suits your day — no messaging back and forth.",
              },
              {
                n: "03",
                title: "Show up",
                body: "Pay at the salon. No booking fees, no card kept on file, nothing to settle in advance.",
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col gap-4.5 border-t border-teal pt-5.5">
                <span className="font-cormorant text-[34px] text-coral italic">{step.n}</span>
                <h3 className="font-cormorant text-2xl text-sage-deep">{step.title}</h3>
                <p className="max-w-[34ch] text-[15px] leading-[1.75] text-sage-deep/70">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-salons" className="px-8 pt-20 pb-24">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-16 border-t border-teal pt-14 sm:grid-cols-[1.2fr_1fr] sm:items-end">
          <div className="flex flex-col gap-5">
            <span className="text-[10px] tracking-[0.26em] text-deep-blue uppercase">
              For salons &amp; practitioners
            </span>
            <h2 className="font-cormorant text-[clamp(30px,3.4vw,46px)] leading-[1.15] text-sage-deep italic">
              Own a salon or practice on the island?
            </h2>
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-[40ch] text-[15px] leading-[1.75] text-sage-deep/70">
              List with On It! at no cost and start taking real-time bookings from
              guests already looking for you.
            </p>
            <Link
              href="/become-a-vendor"
              className="border-b border-teal pb-2 text-[11px] tracking-[0.28em] text-deep-blue uppercase transition-colors hover:border-deep-blue"
            >
              List your salon
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
