import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Vendor-uploaded photos are stored as base64 data URLs (see schema.prisma),
// which is fine for storage but disastrous embedded directly into page HTML
// — every salon card/gallery image was inflating its page's HTML by
// hundreds of KB, on every request, with zero caching. This route serves
// the same bytes as a normal cacheable image response instead, so the page
// itself stays small and the browser only downloads each photo once.
const DATA_URL_PATTERN = /^data:([^;]+);base64,([\s\S]+)$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const { salonId } = await params;
  const type = request.nextUrl.searchParams.get("type");
  const index = Number(request.nextUrl.searchParams.get("index") ?? "0");

  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { coverImage: true, galleryImages: true },
  });
  if (!salon) return NextResponse.json({ error: "not found" }, { status: 404 });

  let dataUrl: string | null | undefined;
  if (type === "cover") {
    dataUrl = salon.coverImage;
  } else if (type === "gallery") {
    const gallery = salon.galleryImages ? (JSON.parse(salon.galleryImages) as string[]) : [];
    dataUrl = gallery[index];
  }
  if (!dataUrl) return NextResponse.json({ error: "not found" }, { status: 404 });

  const match = dataUrl.match(DATA_URL_PATTERN);
  if (!match) return NextResponse.json({ error: "invalid image" }, { status: 500 });
  const [, mimeType, base64] = match;

  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
