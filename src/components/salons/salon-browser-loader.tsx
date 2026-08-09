"use client";

import dynamic from "next/dynamic";

// The interactive shell (Radix Select/Tabs, filters, and the Google Maps
// view) reliably triggered a React hydration mismatch on Vercel production
// specifically — never reproduced locally, including against production
// data, so the exact trigger resisted repeated, methodical diagnosis. A
// mount-gate inside SalonBrowser narrowed but didn't eliminate it; loading
// the whole browser client-only (no SSR for it at all) removes hydration
// from the equation entirely for this page, at the cost of the salon grid
// not being in the initial server-rendered HTML.
//
// `dynamic(..., { ssr: false })` is only allowed inside a Client Component,
// hence this thin wrapper around the actual (server-rendered) page.
export const SalonBrowser = dynamic(
  () => import("@/components/salons/salon-browser").then((mod) => mod.SalonBrowser),
  {
    ssr: false,
    loading: () => (
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-56" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-56" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-48" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    ),
  }
);
