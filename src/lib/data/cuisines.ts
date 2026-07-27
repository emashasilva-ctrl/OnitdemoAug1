import type { Cuisine } from "@/lib/types";

export const cuisines: Cuisine[] = [
  {
    slug: "sri-lankan",
    label: "Sri Lankan",
    shortLabel: "Sri Lankan",
    description: "Rice & curry, hoppers and coastal classics",
    icon: "Soup",
  },
  {
    slug: "indian",
    label: "Indian",
    shortLabel: "Indian",
    description: "Tandoor, curries and biryani",
    icon: "Flame",
  },
  {
    slug: "seafood",
    label: "Seafood",
    shortLabel: "Seafood",
    description: "Fresh catch, coastal grills and crab",
    icon: "Fish",
  },
  {
    slug: "italian",
    label: "Italian",
    shortLabel: "Italian",
    description: "Wood-fired pizza, pasta and wine",
    icon: "Pizza",
  },
  {
    slug: "asian-fusion",
    label: "Asian Fusion",
    shortLabel: "Asian",
    description: "Pan-Asian small plates and noodles",
    icon: "UtensilsCrossed",
  },
  {
    slug: "cafe-brunch",
    label: "Cafe & Brunch",
    shortLabel: "Cafe",
    description: "All-day brunch, coffee and light bites",
    icon: "Coffee",
  },
  {
    slug: "steakhouse",
    label: "Steakhouse",
    shortLabel: "Steak",
    description: "Grills, chops and premium cuts",
    icon: "Beef",
  },
  {
    slug: "bakery-dessert",
    label: "Bakery & Dessert",
    shortLabel: "Dessert",
    description: "Patisserie, cakes and sweet finishes",
    icon: "Croissant",
  },
];

export function getCuisine(slug: string) {
  return cuisines.find((c) => c.slug === slug);
}
