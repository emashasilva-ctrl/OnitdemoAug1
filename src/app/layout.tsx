import type { Metadata, Viewport } from "next";
import { Archivo_Black, Cormorant_Garamond, Fraunces, Jost } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { HomeNav } from "@/components/home/home-nav";
import { MainContent } from "@/components/layout/main-content";
import { HomeFooter } from "@/components/home/home-footer";
import { getCurrentUser } from "@/lib/dal";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-display-black",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Site-wide typography — Jost/Fraunces are mapped to --font-sans/
// --font-heading in globals.css's @theme block, so every existing font-sans/
// font-heading usage (including salon names) picks these up automatically.
// Cormorant Garamond stays available as --font-cormorant for the homepage
// hero/logo, which intentionally keep their existing italic serif treatment.
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onit.lk"),
  title: {
    default: "On It! — Colombo's concierge, on demand",
    template: "%s | On It!",
  },
  description:
    "On It! is Colombo's concierge booking marketplace — real-time booking for salons across the city.",
  applicationName: "On It!",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "On It!",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F1" },
    { media: "(prefers-color-scheme: dark)", color: "#121815" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${cormorantGaramond.variable} ${fraunces.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <HomeNav user={user} />
        <MainContent>{children}</MainContent>
        <HomeFooter />
        <Toaster />
      </body>
    </html>
  );
}
