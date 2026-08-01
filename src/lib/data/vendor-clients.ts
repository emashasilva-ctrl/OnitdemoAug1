import "server-only";
import { prisma } from "@/lib/db";

export interface VendorClient {
  phone: string;
  name: string;
  visits: number;
  totalSpend: number;
  favoriteService: string | null;
  lastVisitDate: string;
}

export async function getTopClientsForSalon(salonId: string): Promise<VendorClient[]> {
  const rows = await prisma.appointment.findMany({
    where: { salonId, status: { not: "CANCELLED" } },
    include: { service: true },
    orderBy: { date: "asc" },
  });

  interface Accumulator {
    phone: string;
    name: string;
    visits: number;
    totalSpend: number;
    lastVisitDate: string;
    serviceCounts: Map<string, number>;
  }

  const byPhone = new Map<string, Accumulator>();
  for (const row of rows) {
    const existing = byPhone.get(row.customerPhone);
    const serviceName = row.service?.name ?? null;
    if (existing) {
      existing.visits += 1;
      existing.totalSpend += row.priceLKR ?? 0;
      existing.name = row.customerName;
      existing.lastVisitDate = row.date;
      if (serviceName) existing.serviceCounts.set(serviceName, (existing.serviceCounts.get(serviceName) ?? 0) + 1);
    } else {
      const serviceCounts = new Map<string, number>();
      if (serviceName) serviceCounts.set(serviceName, 1);
      byPhone.set(row.customerPhone, {
        phone: row.customerPhone,
        name: row.customerName,
        visits: 1,
        totalSpend: row.priceLKR ?? 0,
        lastVisitDate: row.date,
        serviceCounts,
      });
    }
  }

  return [...byPhone.values()]
    .map((c) => {
      let favoriteService: string | null = null;
      let max = 0;
      for (const [name, count] of c.serviceCounts) {
        if (count > max) {
          max = count;
          favoriteService = name;
        }
      }
      return {
        phone: c.phone,
        name: c.name,
        visits: c.visits,
        totalSpend: c.totalSpend,
        favoriteService,
        lastVisitDate: c.lastVisitDate,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
}
