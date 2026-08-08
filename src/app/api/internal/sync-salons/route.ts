import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Temporary, one-off endpoint to sync a handful of local test salons (never
// pushed to production because they only ever existed as local SQLite rows,
// not code) up to the production Turso database. Delete this route once run.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const salons = await prisma.salon.findMany({
    where: { name: { contains: "Mio" } },
    include: { owner: true },
  });
  return NextResponse.json({ salons });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = [
    {
      id: "cmse1q4cd0000sdtl24nar1h5",
      email: "ramani.fernando.salon@onit-testing.lk",
      passwordHash: "$2b$10$TuyzjbwyekTrOAS6bxRL4OpU8S0WjZCYYa92hNlxqUrkg6tqCGGNu",
      name: "Ramani Fernando",
      phone: "+94 77 200 3000",
      isVendor: true,
      createdAt: new Date(1785810940284),
      updatedAt: new Date(1785810940284),
    },
    {
      id: "cmsgwk0me0000sd1ifl97en6z",
      email: "ramani.fernando.salon2@onit-testing.lk",
      passwordHash: "$2b$10$Bw00tFfSaz18dNyHA2vutuk.rqilo3ik39NV8.X/W5P7c.GSNA4S2",
      name: "Ramani Fernando",
      phone: "+94 77 200 3001",
      isVendor: true,
      createdAt: new Date(1785983655974),
      updatedAt: new Date(1785983655974),
    },
  ];

  const salons = [
    {
      id: "cmse1rwz60002sdtlf3y70cmy",
      slug: "elibank-road-salon",
      ownerId: "cmse1q4cd0000sdtl24nar1h5",
      name: "Elibank Road Salon",
      tagline: "Full-service hair and beauty salon in Colombo 5",
      area: "Elibank Road, Colombo 5",
      address: "Elibank Road, Colombo 5",
      lat: 6.8853812,
      lng: 79.8628318,
      categories: JSON.stringify(["hair"]),
      rating: 0,
      reviewCount: 0,
      priceLevel: 2,
      imageSeed: "ramani-fernando-salon-test",
      gallerySeeds: JSON.stringify([
        "ramani-fernando-salon-test-a",
        "ramani-fernando-salon-test-b",
        "ramani-fernando-salon-test-c",
      ]),
      about: "A trusted neighbourhood salon offering hair, skin and beauty services.",
      amenities: JSON.stringify([]),
      featured: false,
      phone: "+94 77 200 3000",
      whatsappNumber: "+94 77 200 3000",
      mioSalonEmbedCode: "https://www.welns.io/product/booking/WFRCHN298142/ELIBANKROAD029056?bk_src=LI103",
      cancellationFeeEnabled: false,
      cancellationFeePercent: 20,
      noShowFeeEnabled: false,
      noShowFeePercent: 20,
      hidden: false,
    },
    {
      id: "cmsgwlib20002sd1i9devvyhf",
      slug: "elibank-beauty-studio",
      ownerId: "cmsgwk0me0000sd1ifl97en6z",
      name: "Elibank Beauty Studio",
      tagline: "Full-service hair and beauty salon in Colombo 5",
      area: "Elibank Road, Colombo 5",
      address: "Elibank Rd, Colombo 00500, Sri Lanka",
      lat: 6.8853812,
      lng: 79.8628318,
      categories: JSON.stringify(["hair"]),
      rating: 0,
      reviewCount: 0,
      priceLevel: 2,
      imageSeed: "ramani-fernando-salon-test-2",
      gallerySeeds: JSON.stringify([
        "ramani-fernando-salon-test-2-a",
        "ramani-fernando-salon-test-2-b",
        "ramani-fernando-salon-test-2-c",
      ]),
      about: "A trusted neighbourhood salon offering hair, skin and beauty services.",
      amenities: JSON.stringify([]),
      featured: false,
      phone: "+94 77 200 3001",
      whatsappNumber: "+94 77 200 3001",
      mioSalonEmbedCode:
        '<iframe src="https://www.welns.io/product/booking/WFRCHN298142?bk_src=WI104" frameborder="0" width="100%" height="400"></iframe>',
      cancellationFeeEnabled: false,
      cancellationFeePercent: 20,
      noShowFeeEnabled: false,
      noShowFeePercent: 20,
      hidden: false,
    },
  ];

  const results: Record<string, string> = {};

  for (const u of users) {
    const { id, ...data } = u;
    await prisma.user.upsert({ where: { id }, create: u, update: data });
    results[`user:${id}`] = "synced";
  }

  for (const s of salons) {
    const { id, ...data } = s;
    await prisma.salon.upsert({ where: { id }, create: s, update: data });
    results[`salon:${id}`] = "synced";
  }

  return NextResponse.json({ ok: true, results });
}
