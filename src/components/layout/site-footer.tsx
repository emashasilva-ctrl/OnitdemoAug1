import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-3 max-w-[22ch] text-sm text-muted-foreground">
              Colombo&apos;s concierge booking marketplace.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Beauty</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/beauty" className="text-sm text-muted-foreground hover:text-foreground">
                  Beauty Home
                </Link>
              </li>
              <li>
                <Link href="/beauty/salons" className="text-sm text-muted-foreground hover:text-foreground">
                  Browse Salons
                </Link>
              </li>
              <li>
                <Link href="/beauty/partner" className="text-sm text-muted-foreground hover:text-foreground">
                  List Your Salon
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/bookings" className="text-sm text-muted-foreground hover:text-foreground">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} On It!. Made for Colombo.</p>
          <p>No booking fees on Beauty</p>
        </div>
      </div>
    </footer>
  );
}
