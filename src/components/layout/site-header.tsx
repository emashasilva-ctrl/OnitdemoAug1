"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

type CurrentUser = { name: string; isVendor: boolean } | null;

// A single-vertical config for now — a future vertical (e.g. fitness) adds its
// own key here with its own nav/book links, the same way "dining" used to.
type Vertical = "beauty" | "neutral";

const VERTICAL_CONFIG: Record<
  Vertical,
  {
    navLinks: { label: string; href: string }[];
    book: { label: string; href: string } | null;
  }
> = {
  beauty: {
    navLinks: [
      { label: "Browse Salons", href: "/beauty/salons" },
      { label: "How It Works", href: "/beauty#how-it-works" },
      { label: "For Salons", href: "/become-a-vendor" },
    ],
    book: { label: "Book Now", href: "/beauty/salons" },
  },
  neutral: {
    navLinks: [
      { label: "Browse Salons", href: "/beauty/salons" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "For Salons", href: "/become-a-vendor" },
    ],
    book: { label: "Book Now", href: "/beauty/salons" },
  },
};

function getVertical(pathname: string): Vertical {
  if (pathname.startsWith("/beauty")) return "beauty";
  return "neutral";
}

export function SiteHeader({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const vertical = getVertical(pathname);
  const { navLinks, book } = VERTICAL_CONFIG[vertical];

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
                pathname === link.href && "bg-muted text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/bookings" aria-label="My bookings">
              <CalendarCheck />
            </Link>
          </Button>

          {user ? (
            <form action={logout} className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">
                Hi, {user.name.split(" ")[0]}
              </span>
              {user.isVendor ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor/dashboard">Vendor Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/become-a-vendor">Become a vendor</Link>
                </Button>
              )}
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {book && (
            <Button asChild className="hidden sm:inline-flex">
              <Link href={book.href}>{book.label}</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
            <SheetContent side="right" className="w-full sm:max-w-xs">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/bookings"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  >
                    <CalendarCheck className="size-4" />
                    My Bookings
                  </Link>
                </SheetClose>
                <div className="mt-2 border-t border-border pt-2">
                  {user ? (
                    <div className="px-3 py-2">
                      <p className="text-sm text-muted-foreground">
                        Signed in as {user.name}
                      </p>
                      {user.isVendor ? (
                        <SheetClose asChild>
                          <Link
                            href="/vendor/dashboard"
                            className="mt-2 block rounded-lg px-0 py-2 text-base font-medium text-foreground hover:bg-muted"
                          >
                            Vendor Dashboard
                          </Link>
                        </SheetClose>
                      ) : (
                        <SheetClose asChild>
                          <Link
                            href="/become-a-vendor"
                            className="mt-2 block rounded-lg px-0 py-2 text-base font-medium text-foreground hover:bg-muted"
                          >
                            Become a vendor
                          </Link>
                        </SheetClose>
                      )}
                      <form action={logout}>
                        <Button type="submit" variant="outline" size="sm" className="mt-2 w-full">
                          Log out
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 px-3 py-2">
                      <SheetClose asChild>
                        <Link
                          href="/login"
                          className="rounded-lg px-0 py-2 text-base font-medium text-foreground hover:bg-muted"
                        >
                          Log in
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/signup"
                          className="rounded-lg px-0 py-2 text-base font-medium text-foreground hover:bg-muted"
                        >
                          Sign up
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </nav>
              {book && (
                <div className="mt-auto flex flex-col gap-2 p-4">
                  <SheetClose asChild>
                    <Button asChild size="lg" className="w-full">
                      <Link href={book.href}>{book.label}</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
