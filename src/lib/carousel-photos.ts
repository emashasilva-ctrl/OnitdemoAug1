import type { CarouselPhoto } from "@/components/photo-carousel";

const lighthouse: CarouselPhoto = { src: "/carousel/lighthouse.jpg", alt: "Galle lighthouse, Sri Lanka" };
const stiltFishermen: CarouselPhoto = { src: "/carousel/stiltfishermen.jpg", alt: "Traditional stilt fishermen near Galle, Sri Lanka" };
const beach: CarouselPhoto = { src: "/carousel/beach.jpg", alt: "Mirissa beach, Sri Lanka" };
const surf: CarouselPhoto = { src: "/carousel/surf.jpg", alt: "Surfing at Arugam Bay, Sri Lanka" };
const massage: CarouselPhoto = { src: "/carousel/massage.jpg", alt: "Spa massage treatment" };
const nails: CarouselPhoto = { src: "/carousel/nails.jpg", alt: "Nail art manicure" };
const poolsideFruit: CarouselPhoto = { src: "/carousel/poolside-fruit.jpg", alt: "Poolside tropical fruit platter, Sri Lanka" };
const kingCoconuts: CarouselPhoto = { src: "/carousel/king-coconuts.jpg", alt: "Fresh king coconuts, Sri Lanka" };

export const homePhotos: CarouselPhoto[] = [
  lighthouse,
  stiltFishermen,
  massage,
  poolsideFruit,
  beach,
  nails,
  kingCoconuts,
  surf,
];

export const beautyPhotos: CarouselPhoto[] = [
  massage,
  nails,
  lighthouse,
  stiltFishermen,
  beach,
  poolsideFruit,
  surf,
  kingCoconuts,
];

export const diningPhotos: CarouselPhoto[] = [
  poolsideFruit,
  surf,
  kingCoconuts,
  lighthouse,
  stiltFishermen,
  beach,
  massage,
  nails,
];
