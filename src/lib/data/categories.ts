import type { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    slug: "hair",
    label: "Hair & Styling",
    shortLabel: "Hair",
    description: "Cuts, colour, blow-dries and treatments",
    icon: "Scissors",
  },
  {
    slug: "nails",
    label: "Nails",
    shortLabel: "Nails",
    description: "Manicures, pedicures and nail art",
    icon: "Sparkles",
  },
  {
    slug: "skin-facial",
    label: "Skin & Facial",
    shortLabel: "Facials",
    description: "Facials, peels and skin treatments",
    icon: "Sun",
  },
  {
    slug: "spa-massage",
    label: "Spa & Massage",
    shortLabel: "Spa",
    description: "Massages, body treatments and wellness",
    icon: "Flower2",
  },
  {
    slug: "bridal-makeup",
    label: "Bridal & Makeup",
    shortLabel: "Bridal",
    description: "Bridal packages and occasion makeup",
    icon: "Gem",
  },
  {
    slug: "mens-grooming",
    label: "Men's Grooming",
    shortLabel: "Men's",
    description: "Cuts, shaves and grooming for men",
    icon: "UserRound",
  },
  {
    slug: "brows-lashes",
    label: "Brows & Lashes",
    shortLabel: "Brows",
    description: "Shaping, tinting and lash extensions",
    icon: "Eye",
  },
  {
    slug: "waxing-threading",
    label: "Waxing & Threading",
    shortLabel: "Waxing",
    description: "Waxing, threading and hair removal",
    icon: "Wind",
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
