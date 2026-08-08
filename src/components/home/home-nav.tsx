"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, CalendarCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { HERO_SENTINEL_ID } from "@/components/home/video-carousel";

type CurrentUser = { name: string; isVendor: boolean } | null;

const NAV_LINKS = [
  { label: "Browse Salons", href: "/beauty/salons" },
  { label: "How it works", href: "/#how" },
  { label: "For salons", href: "/#for-salons" },
];

export function HomeNav({ user }: { user: CurrentUser }) {
  // Default to solid — correct for every page except the homepage hero, which
  // flips to transparent as soon as its effect finds the sentinel above the fold.
  const [scrolled, setScrolled] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      const sentinel = document.getElementById(HERO_SENTINEL_ID);
      // No sentinel means this page has no hero to be transparent over — stay
      // solid. Where there is one, the nav should only stay transparent right
      // at the very top, overlaying the hero image — turn solid as soon as
      // the user scrolls at all, rather than waiting for the whole hero to
      // pass, which left it transparent (and overlapping) over the content
      // below the hero for a full viewport height of scrolling.
      const isScrolled = sentinel ? window.scrollY > 10 : true;
      setScrolled((prev) => (prev === isScrolled ? prev : isScrolled));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  const navText = scrolled ? "text-sage-deep" : "text-sand";
  const navBg = scrolled ? "bg-sand" : "bg-transparent";
  const navBorder = scrolled ? "border-teal" : "border-transparent";
  const pillBorder = scrolled ? "border-sage-deep/20" : "border-sand/40";

  return (
    <nav
      className={`fixed top-0 left-0 z-50 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-8 py-6 font-jost transition-colors duration-400 sm:py-3 ${navBg} ${navBorder}`}
    >
      <div className="col-start-1 flex items-center">
        <Link
          href="/"
          className={`font-cormorant text-3xl font-bold tracking-[0.04em] sm:text-[34px] ${navText}`}
        >
          On It!
        </Link>
      </div>

      <div className={`col-start-2 hidden items-center justify-center gap-8 text-[13px] uppercase tracking-[0.22em] md:flex ${navText}`}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors duration-300 hover:text-terracotta">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="col-start-3 flex items-center justify-end gap-3">
        <Link
          href="/bookings"
          aria-label="My bookings"
          className={`hidden rounded-full p-2 transition-opacity hover:opacity-75 sm:inline-flex ${navText}`}
        >
          <CalendarCheck className="size-4" />
        </Link>

        {user ? (
          <div className={`hidden items-center gap-3 sm:flex ${navText}`}>
            <Link
              href={user.isVendor ? "/vendor/profile" : "/account"}
              className="text-sm hover:underline"
            >
              Hi, {user.name.split(" ")[0]}
            </Link>
            <Link
              href={user.isVendor ? "/vendor/dashboard" : "/become-a-vendor"}
              className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-75 ${pillBorder}`}
            >
              {user.isVendor ? "Vendor Dashboard" : "Become a vendor"}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-75 ${pillBorder}`}
              >
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className={`rounded-full border px-[22px] py-[9px] text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-75 ${navText} ${pillBorder}`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-75 ${pillBorder} ${navText}`}
            >
              Sign up
            </Link>
          </div>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className={`bg-transparent p-1 md:hidden ${navText}`}
          >
            <Menu />
          </button>
          <SheetContent side="right" className="w-full sm:max-w-xs">
            <SheetHeader>
              <SheetTitle className="font-cormorant text-2xl">On It!</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link href={link.href} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted">
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link
                  href="/bookings"
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  <CalendarCheck className="size-4" />
                  My Bookings
                </Link>
              </SheetClose>
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-border px-4 pt-4">
              {user ? (
                <>
                  <SheetClose asChild>
                    <Link
                      href={user.isVendor ? "/vendor/profile" : "/account"}
                      className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                      Signed in as {user.name}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href={user.isVendor ? "/vendor/dashboard" : "/become-a-vendor"}
                      className="rounded-lg px-3 py-2 text-base font-medium hover:bg-muted"
                    >
                      {user.isVendor ? "Vendor Dashboard" : "Become a vendor"}
                    </Link>
                  </SheetClose>
                  <form action={logout} className="px-3">
                    <button type="submit" className="text-left text-base font-medium">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <SheetClose asChild>
                    <Link href="/login" className="rounded-lg px-3 py-2 text-base font-medium hover:bg-muted">
                      Log in
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/signup" className="rounded-lg px-3 py-2 text-base font-medium hover:bg-muted">
                      Sign up
                    </Link>
                  </SheetClose>
                </>
              )}
            </div>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <SheetClose asChild>
                <Link
                  href="/beauty/salons"
                  className="w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground"
                >
                  Book Now
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
