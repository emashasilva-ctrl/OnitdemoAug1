export type CategorySlug =
  | "hair"
  | "nails"
  | "skin-facial"
  | "spa-massage"
  | "bridal-makeup"
  | "mens-grooming"
  | "brows-lashes"
  | "waxing-threading";

export interface Category {
  slug: CategorySlug;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface Service {
  id: string;
  name: string;
  category: string; // one of CategorySlug, or a vendor-chosen custom label
  durationMins: number;
  priceLKR: number;
  description: string;
}

export type CuisineSlug =
  | "sri-lankan"
  | "indian"
  | "seafood"
  | "italian"
  | "asian-fusion"
  | "cafe-brunch"
  | "steakhouse"
  | "bakery-dessert";

export interface Cuisine {
  slug: CuisineSlug;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface MenuHighlight {
  id: string;
  name: string;
  priceLKR: number;
  description: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface OpenHours {
  day: string;
  hours: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  categories: CategorySlug[];
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3;
  imageSeed: string;
  gallerySeeds: string[];
  about: string;
  amenities: string[];
  services: Service[];
  openHours: OpenHours[];
  reviews: Review[];
  activePromotions: Promotion[];
  featured: boolean;
  phone: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  cuisines: CuisineSlug[];
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  imageSeed: string;
  gallerySeeds: string[];
  about: string;
  amenities: string[];
  menuHighlights: MenuHighlight[];
  partySizes: number[];
  openHours: OpenHours[];
  reviews: Review[];
  featured: boolean;
  phone: string;
}

interface AppointmentBase {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
  status: "upcoming" | "cancelled" | "completed";
}

export interface SalonBookingRecord extends AppointmentBase {
  kind: "salon";
  salonId: string;
  salonName: string;
  salonArea: string;
  serviceId: string;
  serviceName: string;
  priceLKR: number;
  durationMins: number;
}

export interface RestaurantReservationRecord extends AppointmentBase {
  kind: "restaurant";
  restaurantId: string;
  restaurantName: string;
  restaurantArea: string;
  partySize: number;
  cardLast4: string;
}

export type AppointmentRecord = SalonBookingRecord | RestaurantReservationRecord;
