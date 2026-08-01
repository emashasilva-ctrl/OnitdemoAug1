/**
 * One-off enrichment script: adds a realistic spread of historic (and a few
 * upcoming) sample bookings to The Parlour, Colpetty, so the vendor Analytics
 * and Clients tabs have real-looking data for investor demos.
 *
 * Not part of `npm run db:seed` — run manually with `npx tsx prisma/seed-demo-data.ts`.
 * Safe to re-run: skips entirely if the salon already has more than a handful
 * of appointments.
 */
import { PrismaClient } from "@prisma/client";
import { subDays, addDays } from "date-fns";

const prisma = new PrismaClient();

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

interface Spec {
  dayOffset: number; // negative = in the future
  hour: number;
  minute: number;
  customerName: string;
  customerPhone: string;
  serviceKey: string;
  teamMemberKey: "amara" | "nadia" | null;
  status: "UPCOMING" | "CANCELLED";
}

const SPECS: Spec[] = [
  { dayOffset: 65, hour: 10, minute: 0, customerName: "Nadeesha Wickramasinghe", customerPhone: "+94 77 111 2222", serviceKey: "cut", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 48, hour: 14, minute: 30, customerName: "Nadeesha Wickramasinghe", customerPhone: "+94 77 111 2222", serviceKey: "brow", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 30, hour: 10, minute: 0, customerName: "Nadeesha Wickramasinghe", customerPhone: "+94 77 111 2222", serviceKey: "colour", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 14, hour: 11, minute: 0, customerName: "Nadeesha Wickramasinghe", customerPhone: "+94 77 111 2222", serviceKey: "cut", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: -5, hour: 10, minute: 0, customerName: "Nadeesha Wickramasinghe", customerPhone: "+94 77 111 2222", serviceKey: "brow", teamMemberKey: "amara", status: "UPCOMING" },

  { dayOffset: 60, hour: 13, minute: 0, customerName: "Chamodi Fernando", customerPhone: "+94 71 222 3333", serviceKey: "balayage", teamMemberKey: "nadia", status: "UPCOMING" },
  { dayOffset: 40, hour: 13, minute: 0, customerName: "Chamodi Fernando", customerPhone: "+94 71 222 3333", serviceKey: "facial", teamMemberKey: "nadia", status: "UPCOMING" },
  { dayOffset: 20, hour: 15, minute: 0, customerName: "Chamodi Fernando", customerPhone: "+94 71 222 3333", serviceKey: "balayage", teamMemberKey: "nadia", status: "UPCOMING" },
  { dayOffset: -2, hour: 13, minute: 0, customerName: "Chamodi Fernando", customerPhone: "+94 71 222 3333", serviceKey: "facial", teamMemberKey: "nadia", status: "UPCOMING" },

  { dayOffset: 55, hour: 9, minute: 0, customerName: "Ishara Perera", customerPhone: "+94 76 333 4444", serviceKey: "colour", teamMemberKey: null, status: "UPCOMING" },
  { dayOffset: 35, hour: 9, minute: 30, customerName: "Ishara Perera", customerPhone: "+94 76 333 4444", serviceKey: "cut", teamMemberKey: null, status: "UPCOMING" },
  { dayOffset: 10, hour: 16, minute: 0, customerName: "Ishara Perera", customerPhone: "+94 76 333 4444", serviceKey: "colour", teamMemberKey: "amara", status: "UPCOMING" },

  { dayOffset: 45, hour: 11, minute: 0, customerName: "Vindya Rathnayake", customerPhone: "+94 70 444 5555", serviceKey: "keratin", teamMemberKey: "nadia", status: "UPCOMING" },
  { dayOffset: 8, hour: 11, minute: 0, customerName: "Vindya Rathnayake", customerPhone: "+94 70 444 5555", serviceKey: "keratin", teamMemberKey: "nadia", status: "UPCOMING" },

  { dayOffset: 25, hour: 17, minute: 0, customerName: "Sanduni Jayawardena", customerPhone: "+94 77 555 6666", serviceKey: "facial", teamMemberKey: null, status: "UPCOMING" },
  { dayOffset: 6, hour: 17, minute: 30, customerName: "Sanduni Jayawardena", customerPhone: "+94 77 555 6666", serviceKey: "brow", teamMemberKey: null, status: "UPCOMING" },

  { dayOffset: 50, hour: 12, minute: 0, customerName: "Dilini Gunasekara", customerPhone: "+94 71 666 7777", serviceKey: "cut", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 15, hour: 12, minute: 30, customerName: "Dilini Gunasekara", customerPhone: "+94 71 666 7777", serviceKey: "cut", teamMemberKey: "amara", status: "CANCELLED" },

  { dayOffset: 42, hour: 15, minute: 30, customerName: "Thilini Bandara", customerPhone: "+94 76 777 8888", serviceKey: "balayage", teamMemberKey: "nadia", status: "UPCOMING" },
  { dayOffset: 3, hour: 15, minute: 30, customerName: "Thilini Bandara", customerPhone: "+94 76 777 8888", serviceKey: "balayage", teamMemberKey: "nadia", status: "UPCOMING" },

  { dayOffset: 33, hour: 10, minute: 30, customerName: "Amaya de Silva", customerPhone: "+94 70 888 9999", serviceKey: "colour", teamMemberKey: null, status: "UPCOMING" },
  { dayOffset: 18, hour: 14, minute: 0, customerName: "Kavya Senanayake", customerPhone: "+94 77 999 0000", serviceKey: "facial", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 22, hour: 9, minute: 0, customerName: "Ruvini Abeysekera", customerPhone: "+94 71 000 1111", serviceKey: "brow", teamMemberKey: "nadia", status: "CANCELLED" },
  { dayOffset: 12, hour: 16, minute: 30, customerName: "Tharushi Wijesinghe", customerPhone: "+94 77 333 4455", serviceKey: "keratin", teamMemberKey: null, status: "UPCOMING" },
  { dayOffset: 5, hour: 13, minute: 30, customerName: "Nimasha Karunaratne", customerPhone: "+94 71 666 5544", serviceKey: "cut", teamMemberKey: "amara", status: "UPCOMING" },
  { dayOffset: 1, hour: 10, minute: 0, customerName: "Oshadi Rajapaksa", customerPhone: "+94 77 999 8877", serviceKey: "colour", teamMemberKey: "nadia", status: "UPCOMING" },
];

async function main() {
  const salon = await prisma.salon.findUnique({ where: { slug: "the-parlour-colpetty" } });
  if (!salon) throw new Error("The Parlour, Colpetty not found — run the main seed first.");

  const existingCount = await prisma.appointment.count({ where: { salonId: salon.id } });
  if (existingCount > 10) {
    console.log(`Salon already has ${existingCount} appointments — skipping (looks already seeded).`);
    return;
  }

  const services = await prisma.service.findMany({ where: { salonId: salon.id } });
  const serviceByKey: Record<string, (typeof services)[number]> = {
    cut: services.find((s) => s.name === "Signature Cut & Finish")!,
    colour: services.find((s) => s.name === "Global Colour")!,
    balayage: services.find((s) => s.name === "Balayage")!,
    facial: services.find((s) => s.name === "Express Facial")!,
    brow: services.find((s) => s.name === "Brow Shape & Tint")!,
    keratin: services.find((s) => s.name === "Keratin Treatment")!,
  };

  const teamMembers = await prisma.teamMember.findMany({ where: { salonId: salon.id } });
  const teamByKey: Record<"amara" | "nadia", string | undefined> = {
    amara: teamMembers.find((m) => m.name === "Amara Silva")?.id,
    nadia: teamMembers.find((m) => m.name === "Nadia Perera")?.id,
  };

  const today = new Date();

  const data = SPECS.map((spec) => {
    const service = serviceByKey[spec.serviceKey];
    if (!service) throw new Error(`Unknown service key: ${spec.serviceKey}`);
    const date = spec.dayOffset >= 0 ? subDays(today, spec.dayOffset) : addDays(today, -spec.dayOffset);
    const startMinutes = spec.hour * 60 + spec.minute;

    return {
      kind: "SALON" as const,
      status: spec.status,
      date: toLocalISODate(date),
      time: minutesToLabel(startMinutes),
      startMinutes,
      customerId: null,
      customerName: spec.customerName,
      customerPhone: spec.customerPhone,
      isManual: true,
      salonId: salon.id,
      serviceId: service.id,
      durationMins: service.durationMins,
      priceLKR: service.priceLKR,
      teamMemberId: spec.teamMemberKey ? teamByKey[spec.teamMemberKey] : null,
    };
  });

  await prisma.appointment.createMany({ data });
  console.log(`Inserted ${data.length} sample appointments for ${salon.name}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
