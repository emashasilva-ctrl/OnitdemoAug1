"use client";

import { usePathname } from "next/navigation";

// The nav is `fixed`, not `sticky`, so it no longer reserves its own space in
// normal flow. Every page needs top padding to clear it — except the homepage,
// whose video hero is designed to sit full-bleed underneath the transparent nav.
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return <main className={`flex-1 ${isHome ? "" : "pt-24"}`}>{children}</main>;
}
