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

export type PricingRuleType = "DISCOUNT" | "SURCHARGE";
export type PricingRuleAmountType = "PERCENT" | "FLAT";

export interface PricingRule {
  id: string;
  label: string;
  type: PricingRuleType;
  amountType: PricingRuleAmountType;
  amount: number;
  days: string[];
  startMinutes: number;
  endMinutes: number;
  appliesToAllServices: boolean;
  serviceIds: string[];
  enabled: boolean;
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
  coverImage: string | null;
  galleryImages: string[];
  about: string;
  amenities: string[];
  services: Service[];
  openHours: OpenHours[];
  reviews: Review[];
  activePromotions: Promotion[];
  pricingRules: PricingRule[];
  cancellationFeeEnabled: boolean;
  cancellationFeePercent: number;
  noShowFeeEnabled: boolean;
  noShowFeePercent: number;
  featured: boolean;
  phone: string;
  whatsappNumber: string | null;
  mioSalonEmbedCode: string | null;
  hidden: boolean;
}

interface AppointmentBase {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
  status: "upcoming" | "checked_in" | "no_show" | "cancelled" | "completed";
}

export interface SalonBookingRecord extends AppointmentBase {
  kind: "salon";
  salonId: string;
  salonName: string;
  salonArea: string;
  serviceId: string;
  serviceName: string;
  priceLKR: number;
  basePriceLKR: number | null;
  appliedRuleLabel: string | null;
  cancellationFeeLKR: number | null;
  durationMins: number;
}

// A discriminated union of one for now — a future vertical (e.g. fitness) adds
// its own record type as a second member, the same way this would have grown
// if Dining were still around.
export type AppointmentRecord = SalonBookingRecord;
