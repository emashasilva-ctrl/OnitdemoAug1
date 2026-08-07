import Link from "next/link";
import { categories } from "@/lib/data/categories";
import type { CategorySlug } from "@/lib/types";

const ICON_IDS: Record<CategorySlug, string> = {
  hair: "ic-hair",
  nails: "ic-nails",
  "skin-facial": "ic-skin",
  "spa-massage": "ic-spa",
  "bridal-makeup": "ic-bridal",
  "mens-grooming": "ic-mens",
  "brows-lashes": "ic-brows",
  "waxing-threading": "ic-waxing",
};

function formatPrice(lkr: number | null) {
  if (lkr === null) return "Not yet available";
  return `From LKR ${lkr.toLocaleString("en-LK")}`;
}

export function QuickServicesGrid({
  area,
  prices,
}: {
  area?: string;
  prices: Record<CategorySlug, number | null>;
}) {
  return (
    <section className="border-b border-teal px-8 pt-14 pb-15">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 className="font-cormorant text-[28px] text-sage-deep">
            Most requested <span className="text-deep-blue">{area ? `in ${area}` : "across the island"}</span>
          </h2>
          <span className="hidden text-[10px] tracking-[0.2em] text-deep-blue uppercase sm:inline">
            Same-day where available
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/beauty/salons?category=${c.slug}`}
              className="flex flex-col items-start gap-3.5 border border-teal p-5 text-left transition-all duration-300 hover:border-deep-blue"
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 32 32"
                fill="none"
                stroke="#f97171"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <use href={`#${ICON_IDS[c.slug]}`} />
              </svg>
              <span className="font-cormorant text-[19px] font-bold text-sage-deep">{c.label}</span>
              <span className="text-[11px] font-bold tracking-[0.16em] text-sage-deep/50 uppercase">
                {formatPrice(prices[c.slug])}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <ServiceIconSymbols />
    </section>
  );
}

function ServiceIconSymbols() {
  return (
    <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden="true">
      <defs>
        <symbol id="ic-hair" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="24" r="4" /><circle cx="20" cy="24" r="4" />
          <path d="M10.6 21 24 5" /><path d="M17.4 21 4 5" />
        </symbol>
        <symbol id="ic-nails" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 14h9v13a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z" /><path d="M13 14v-3h5v3" />
          <path d="M23 5l4 2-5 9" />
        </symbol>
        <symbol id="ic-skin" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4c6 7 8 11 8 15a8 8 0 0 1-16 0c0-4 2-8 8-15z" /><path d="M13 21a3 3 0 0 0 3 3" />
        </symbol>
        <symbol id="ic-spa" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10c3-3 5 3 8 0s5 3 8 0 5 3 8 0" /><path d="M4 18c3-3 5 3 8 0s5 3 8 0 5 3 8 0" />
          <path d="M4 26c3-3 5 3 8 0s5 3 8 0 5 3 8 0" />
        </symbol>
        <symbol id="ic-bridal" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 13h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" /><path d="M13 13V6l6-3v10" />
        </symbol>
        <symbol id="ic-mens" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 19c-2-5-8-6-11-3 2 5 8 7 11 3z" /><path d="M16 19c2-5 8-6 11-3-2 5-8 7-11 3z" />
          <path d="M16 19v5" />
        </symbol>
        <symbol id="ic-brows" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13c3-4 8-4 11 0" /><path d="M18 13c3-4 8-4 11 0" />
          <path d="M4 17v3" /><path d="M8.5 17.5v3.5" /><path d="M13 17v3" />
          <path d="M19 17v3" /><path d="M23.5 17.5v3.5" /><path d="M28 17v3" />
        </symbol>
        <symbol id="ic-waxing" viewBox="0 0 32 32" fill="none" stroke="#f97171" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h20v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" /><path d="M6 16c3-3 5 3 8 0s5 3 8 0 4 2 4 2" />
          <path d="M10 9V5h12v4" />
        </symbol>
      </defs>
    </svg>
  );
}
