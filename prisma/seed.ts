import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { salons } from "./seed-data/salons";
import { restaurants } from "./seed-data/restaurants";
import type { OpenHours, Review, Service, MenuHighlight } from "../src/lib/types";

const prisma = new PrismaClient();

function parseTimeToMinutes(label: string): number {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) throw new Error(`Unrecognized time label: "${label}"`);
  const [, hourStr, minuteStr, meridiem] = match;
  let hour = Number(hourStr) % 12;
  if (meridiem.toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(minuteStr);
}

function parseOpenHours(hours: OpenHours[]) {
  return hours.map(({ day, hours: label }) => {
    const [openLabel, closeLabel] = label.split("–").map((s) => s.trim());
    return {
      day,
      openMinutes: parseTimeToMinutes(openLabel),
      closeMinutes: parseTimeToMinutes(closeLabel),
    };
  });
}

const DEMO_PASSWORD = "OnItDemo123!";

async function main() {
  console.log("Seeding database...");

  for (const s of salons) {
    await prisma.salon.create({
      data: {
        id: s.id,
        slug: s.slug,
        name: s.name,
        tagline: s.tagline,
        area: s.area,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        categories: JSON.stringify(s.categories),
        rating: s.rating,
        reviewCount: s.reviewCount,
        priceLevel: s.priceLevel,
        imageSeed: s.imageSeed,
        gallerySeeds: JSON.stringify(s.gallerySeeds),
        about: s.about,
        amenities: JSON.stringify(s.amenities),
        featured: s.featured,
        phone: s.phone,
        services: {
          create: s.services.map(({ id, ...rest }: Service) => ({ id, ...rest })),
        },
        openHours: { create: parseOpenHours(s.openHours) },
        reviews: {
          // Source review ids (e.g. "r1", "r2") are only unique per-venue, not
          // globally, so let Prisma generate fresh ids instead of reusing them.
          create: s.reviews.map((r: Review) => ({
            author: r.author,
            rating: r.rating,
            date: new Date(r.date),
            comment: r.comment,
          })),
        },
      },
    });
  }
  console.log(`  Seeded ${salons.length} salons.`);

  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        id: r.id,
        slug: r.slug,
        name: r.name,
        tagline: r.tagline,
        area: r.area,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        cuisines: JSON.stringify(r.cuisines),
        rating: r.rating,
        reviewCount: r.reviewCount,
        priceLevel: r.priceLevel,
        imageSeed: r.imageSeed,
        gallerySeeds: JSON.stringify(r.gallerySeeds),
        about: r.about,
        amenities: JSON.stringify(r.amenities),
        partySizes: JSON.stringify(r.partySizes),
        featured: r.featured,
        phone: r.phone,
        menuHighlights: {
          create: r.menuHighlights.map(({ id, ...rest }: MenuHighlight) => ({ id, ...rest })),
        },
        openHours: { create: parseOpenHours(r.openHours) },
        reviews: {
          // Restaurant review ids (e.g. "r1rev1") are unique globally already,
          // but let Prisma generate fresh ids for consistency with salons above.
          create: r.reviews.map((review: Review) => ({
            author: review.author,
            rating: review.rating,
            date: new Date(review.date),
            comment: review.comment,
          })),
        },
      },
    });
  }
  console.log(`  Seeded ${restaurants.length} restaurants.`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.create({
    data: {
      email: "customer@onit.lk",
      passwordHash,
      name: "Amaya Silva",
      phone: "+94 77 123 4567",
      isVendor: false,
    },
  });

  const demoSalonVendor = await prisma.user.create({
    data: {
      email: "vendor-salon@onit.lk",
      passwordHash,
      name: "Ridma Fernando",
      phone: "+94 77 234 5678",
      isVendor: true,
    },
  });
  await prisma.salon.update({
    where: { id: salons[0].id },
    data: { ownerId: demoSalonVendor.id },
  });

  const demoRestaurantVendor = await prisma.user.create({
    data: {
      email: "vendor-dining@onit.lk",
      passwordHash,
      name: "Kavindu Ranasinghe",
      phone: "+94 77 345 6789",
      isVendor: true,
    },
  });
  await prisma.restaurant.update({
    where: { id: restaurants[0].id },
    data: { ownerId: demoRestaurantVendor.id },
  });

  console.log("\nDemo accounts (all use the same password):");
  console.log(`  Customer:          customer@onit.lk`);
  console.log(`  Vendor (salon):    vendor-salon@onit.lk   -> owns "${salons[0].name}"`);
  console.log(`  Vendor (dining):   vendor-dining@onit.lk  -> owns "${restaurants[0].name}"`);
  console.log(`  Password for all:  ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
