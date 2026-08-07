"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BASE_NAV_LINKS = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Services", href: "/vendor/services" },
  { label: "Hours", href: "/vendor/hours" },
  { label: "Calendar", href: "/vendor/calendar" },
];

const PROMOTIONS_LINK = { label: "Promotions", href: "/vendor/promotions" };
const TEAM_LINK = { label: "Team", href: "/vendor/team" };
const CLIENTS_LINK = { label: "Clients", href: "/vendor/clients" };
const BILLS_LINK = { label: "Bills", href: "/vendor/bills" };
const PROFILE_LINK = { label: "Salon Profile", href: "/vendor/profile" };

export function VendorNav({
  servicesLabel,
  kind,
}: {
  servicesLabel: string;
  kind: "salon";
}) {
  const pathname = usePathname();
  const navLinks = [
    ...BASE_NAV_LINKS,
    PROMOTIONS_LINK,
    TEAM_LINK,
    CLIENTS_LINK,
    BILLS_LINK,
    PROFILE_LINK,
  ];

  return (
    <nav className="flex items-center gap-1 border-b border-border" aria-label="Vendor">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-t-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            pathname === link.href && "border-b-2 border-primary text-foreground"
          )}
        >
          {link.href === "/vendor/services" ? servicesLabel : link.label}
        </Link>
      ))}
    </nav>
  );
}
