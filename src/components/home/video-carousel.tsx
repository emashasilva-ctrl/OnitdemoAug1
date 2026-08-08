"use client";

import { useEffect, useRef, useState } from "react";

export const HERO_SENTINEL_ID = "hero-end-sentinel";

const SLIDES = [
  { id: "nails", label: "Nails", src: "/videos/hero-nails.mp4", alt: "A calm close-up of a luxury manicure in progress" },
  { id: "hair", label: "Hair", src: "/videos/hero-blowdry.mp4", alt: "Long hair flowing during a salon blow dry" },
  { id: "massage", label: "Massage", src: "/videos/hero-massage.mp4", alt: "A serene oil massage in a candlelit spa room" },
  { id: "makeup", label: "Makeup", src: "/videos/hero-makeup.mp4", alt: "A makeup artist applying luminous highlighter" },
  { id: "waxing", label: "Waxing", src: "/videos/hero-waxing.mp4", alt: "Warm sugaring wax in a minimalist beauty studio" },
  { id: "meditation", label: "Meditation", src: "/videos/hero-meditation.mp4", alt: "A woman meditating in a sunlit open pavilion" },
] as const;

const SLIDE_INTERVAL_MS = 7000;

export function VideoCarousel({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="experience" className="relative min-h-screen w-full overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 10 : 1 }}
        >
          <HeroVideo src={slide.src} alt={slide.alt} />
        </div>
      ))}

      <div
        className="absolute inset-0 z-20"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.10), rgba(0,0,0,.35))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      <div className="relative z-30 flex min-h-screen w-full items-center justify-center px-4 pt-[130px] pb-[190px]">
        {children}
      </div>

      <div id={HERO_SENTINEL_ID} className="pointer-events-none absolute inset-x-0 bottom-0 h-px" />

      <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 px-4 sm:bottom-12 sm:gap-8 sm:px-0">
        {SLIDES.map((slide, i) => {
          const isActive = i === active;
          return (
            <button
              key={slide.id}
              onClick={() => setActive(i)}
              aria-label={`Show ${slide.label} slide`}
              className="flex flex-col items-center gap-2 bg-transparent p-0 font-jost"
            >
              <div
                className="w-px bg-sand transition-all duration-500"
                style={{ height: isActive ? "48px" : "32px" }}
              />
              <span
                className="hidden text-[10px] uppercase tracking-[0.15em] text-sand transition-opacity duration-300 sm:inline"
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                {slide.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HeroVideo({ src, alt }: { src: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Set as properties, not JSX attributes — React drops the boolean `muted`
    // attribute, which then blocks autoplay in most browsers.
    el.muted = true;
    el.autoplay = true;
    el.loop = true;
    el.playsInline = true;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      aria-label={alt}
      className="h-full w-full object-cover"
    />
  );
}
