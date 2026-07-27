import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "On It! — Colombo Concierge Booking",
    short_name: "On It!",
    description:
      "Colombo's concierge booking marketplace. Real-time booking for salons and restaurants across the city.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F9",
    theme_color: "#F7F8F9",
    categories: ["lifestyle", "shopping", "beauty", "food"],
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
