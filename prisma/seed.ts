import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { salons } from "./seed-data/salons";
import type { OpenHours, Review, Service } from "../src/lib/types";

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

  // A second demo vendor whose salon books through MioSalon's embedded widget
  // instead of On It!'s native flow, for testing/demoing that integration.
  const demoMioSalonVendor = await prisma.user.create({
    data: {
      email: "vendor-miosalon@onit.lk",
      passwordHash,
      name: "Nadeeka Perera",
      phone: "+94 77 456 7890",
      isVendor: true,
    },
  });
  await prisma.salon.update({
    where: { id: salons[1].id },
    data: {
      ownerId: demoMioSalonVendor.id,
      mioSalonEmbedCode: `<div id="miosalon-widget"></div><script src="https://booking.miosalon.io/embed.js" data-branch="${salons[1].slug}"></script>`,
    },
  });

  console.log("\nDemo accounts (all use the same password):");
  console.log(`  Customer:            customer@onit.lk`);
  console.log(`  Vendor (salon):      vendor-salon@onit.lk      -> owns "${salons[0].name}"`);
  console.log(`  Vendor (MioSalon):   vendor-miosalon@onit.lk   -> owns "${salons[1].name}"`);
  console.log(`  Password for all:    ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
