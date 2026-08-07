import Link from "next/link";

export function HomeFooter() {
  return (
    <footer className="bg-sage-deep px-8 pt-18 pb-10 font-jost text-sand">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-2 gap-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-1">
            <span className="font-cormorant text-2xl">On It!</span>
            <p className="max-w-[26ch] text-sm leading-[1.7] opacity-60">
              Sri Lanka&apos;s private concierge for beauty, wellness and everything in between.
            </p>
          </div>

          <FooterColumn heading="Beauty">
            <FooterLink href="/beauty/salons">Browse services</FooterLink>
            <FooterLink href="/#how">How it works</FooterLink>
            <FooterLink href="/become-a-vendor">List your salon</FooterLink>
          </FooterColumn>

          <FooterColumn heading="Services">
            <FooterLink href="/beauty/salons?category=hair">Hair &amp; styling</FooterLink>
            <FooterLink href="/beauty/salons?category=spa-massage">Spa &amp; massage</FooterLink>
            <FooterLink href="/beauty/salons?category=bridal-makeup">Bridal &amp; makeup</FooterLink>
          </FooterColumn>

          <FooterColumn heading="Company">
            <FooterLink href="/bookings">My bookings</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-14 border-t border-teal pt-6 text-[10px] tracking-[0.18em] opacity-50 uppercase">
          <span>© {new Date().getFullYear()} On It! Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-[10px] tracking-[0.22em] text-teal uppercase">{heading}</span>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm opacity-85 transition-opacity hover:text-mint hover:opacity-100">
      {children}
    </Link>
  );
}
