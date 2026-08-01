import "server-only";
import { prisma } from "@/lib/db";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subDays,
  addDays,
  addWeeks,
  format,
} from "date-fns";
import { toLocalISODate } from "@/lib/time";
import { getTeamMembersForSalon } from "@/lib/data/vendor";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UNASSIGNED = "__unassigned__";

export interface DashboardAgendaItem {
  id: string;
  time: string;
  startMinutes: number;
  label: string;
  customerName: string;
  teamMemberName: string | null;
}

export interface DashboardSummary {
  today: {
    count: number;
    revenue: number;
    appointments: DashboardAgendaItem[];
  };
  week: {
    count: number;
    revenue: number;
    byDay: { day: string; date: string; count: number; isToday: boolean }[];
  };
}

export async function getDashboardSummary(salonId: string, todayISO: string): Promise<DashboardSummary> {
  const today = new Date(`${todayISO}T00:00:00`);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekStartISO = toLocalISODate(weekStart);
  const weekEndISO = toLocalISODate(weekEnd);

  const rows = await prisma.appointment.findMany({
    where: {
      salonId,
      status: { not: "CANCELLED" },
      date: { gte: weekStartISO, lte: weekEndISO },
    },
    include: { service: true, teamMember: true },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  const todayRows = rows.filter((r) => r.date === todayISO);
  const todayRevenue = todayRows.reduce((sum, r) => sum + (r.priceLKR ?? 0), 0);
  const weekRevenue = rows.reduce((sum, r) => sum + (r.priceLKR ?? 0), 0);

  const byDay = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => {
    const iso = toLocalISODate(d);
    return {
      day: DAY_LABELS[d.getDay()],
      date: iso,
      count: rows.filter((r) => r.date === iso).length,
      isToday: iso === todayISO,
    };
  });

  return {
    today: {
      count: todayRows.length,
      revenue: todayRevenue,
      appointments: todayRows.map((r) => ({
        id: r.id,
        time: r.time,
        startMinutes: r.startMinutes,
        label: r.service?.name ?? "Appointment",
        customerName: r.customerName,
        teamMemberName: r.teamMember?.name ?? null,
      })),
    },
    week: {
      count: rows.length,
      revenue: weekRevenue,
      byDay,
    },
  };
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export interface RevenuePoint {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
}

export interface ServiceStat {
  serviceId: string;
  name: string;
  bookings: number;
  revenue: number;
}

export interface TeamMemberStat {
  teamMemberId: string;
  name: string;
  bookings: number;
  revenue: number;
}

export interface HourStat {
  hour: number;
  label: string;
  count: number;
}

export interface SalonAnalytics {
  range: AnalyticsRange;
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  cancellationRate: number;
  revenueSeries: RevenuePoint[];
  topServices: ServiceStat[];
  teamMemberStats: TeamMemberStat[];
  busiestHours: HourStat[];
  newCustomers: number;
  returningCustomers: number;
}

function rangeToStartDate(range: AnalyticsRange, todayISO: string): string | null {
  const today = new Date(`${todayISO}T00:00:00`);
  if (range === "7d") return toLocalISODate(subDays(today, 6));
  if (range === "30d") return toLocalISODate(subDays(today, 29));
  if (range === "90d") return toLocalISODate(subDays(today, 89));
  return null;
}

function hourLabel(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function buildRevenueSeries(
  active: { date: string; priceLKR: number | null }[],
  byWeek: boolean,
  lowerBoundISO: string,
  todayISO: string
): RevenuePoint[] {
  const dates = active.map((r) => r.date).sort();
  const maxDataDate = dates.length ? dates[dates.length - 1] : todayISO;
  const endISO = maxDataDate > todayISO ? maxDataDate : todayISO;

  const bucketed = new Map<string, { revenue: number; bookings: number }>();
  for (const r of active) {
    const bucketKey = byWeek
      ? toLocalISODate(startOfWeek(new Date(`${r.date}T00:00:00`), { weekStartsOn: 1 }))
      : r.date;
    const existing = bucketed.get(bucketKey);
    if (existing) {
      existing.revenue += r.priceLKR ?? 0;
      existing.bookings += 1;
    } else {
      bucketed.set(bucketKey, { revenue: r.priceLKR ?? 0, bookings: 1 });
    }
  }

  const points: RevenuePoint[] = [];
  if (byWeek) {
    let cursor = startOfWeek(new Date(`${lowerBoundISO}T00:00:00`), { weekStartsOn: 1 });
    const endCursor = startOfWeek(new Date(`${endISO}T00:00:00`), { weekStartsOn: 1 });
    while (cursor <= endCursor) {
      const iso = toLocalISODate(cursor);
      const v = bucketed.get(iso) ?? { revenue: 0, bookings: 0 };
      points.push({ date: iso, label: `Wk of ${format(cursor, "MMM d")}`, revenue: v.revenue, bookings: v.bookings });
      cursor = addWeeks(cursor, 1);
    }
  } else {
    let cursor = new Date(`${lowerBoundISO}T00:00:00`);
    const endCursor = new Date(`${endISO}T00:00:00`);
    while (cursor <= endCursor) {
      const iso = toLocalISODate(cursor);
      const v = bucketed.get(iso) ?? { revenue: 0, bookings: 0 };
      points.push({ date: iso, label: format(cursor, "MMM d"), revenue: v.revenue, bookings: v.bookings });
      cursor = addDays(cursor, 1);
    }
  }
  return points;
}

export async function getSalonAnalytics(
  salonId: string,
  range: AnalyticsRange,
  todayISO: string
): Promise<SalonAnalytics> {
  const startDateISO = rangeToStartDate(range, todayISO);

  const rows = await prisma.appointment.findMany({
    where: {
      salonId,
      ...(startDateISO ? { date: { gte: startDateISO, lte: todayISO } } : {}),
    },
    include: { service: true, teamMember: true },
    orderBy: [{ date: "asc" }],
  });

  const active = rows.filter((r) => r.status !== "CANCELLED");
  const totalRevenue = active.reduce((sum, r) => sum + (r.priceLKR ?? 0), 0);
  const totalBookings = active.length;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const cancellationRate = rows.length > 0 ? rows.filter((r) => r.status === "CANCELLED").length / rows.length : 0;

  const byWeek = range === "90d" || range === "all";
  const lowerBoundISO = startDateISO ?? (active.length ? active[0].date : todayISO);
  const revenueSeries = buildRevenueSeries(active, byWeek, lowerBoundISO, todayISO);

  const serviceMap = new Map<string, ServiceStat>();
  for (const r of active) {
    if (!r.serviceId || !r.service) continue;
    const existing = serviceMap.get(r.serviceId);
    if (existing) {
      existing.bookings += 1;
      existing.revenue += r.priceLKR ?? 0;
    } else {
      serviceMap.set(r.serviceId, { serviceId: r.serviceId, name: r.service.name, bookings: 1, revenue: r.priceLKR ?? 0 });
    }
  }
  const topServices = [...serviceMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const teamMembers = await getTeamMembersForSalon(salonId);
  let teamMemberStats: TeamMemberStat[] = [];
  if (teamMembers.length > 0) {
    const teamMap = new Map<string, TeamMemberStat>();
    for (const m of teamMembers) {
      teamMap.set(m.id, { teamMemberId: m.id, name: m.name, bookings: 0, revenue: 0 });
    }
    for (const r of active) {
      const key = r.teamMemberId ?? UNASSIGNED;
      const existing = teamMap.get(key);
      if (existing) {
        existing.bookings += 1;
        existing.revenue += r.priceLKR ?? 0;
      } else if (key === UNASSIGNED) {
        teamMap.set(key, { teamMemberId: UNASSIGNED, name: "Unassigned", bookings: 1, revenue: r.priceLKR ?? 0 });
      }
    }
    teamMemberStats = [...teamMap.values()].sort((a, b) => b.revenue - a.revenue);
  }

  const hourCounts = new Array(24).fill(0) as number[];
  for (const r of active) {
    const hour = Math.floor(r.startMinutes / 60);
    if (hour >= 0 && hour < 24) hourCounts[hour] += 1;
  }
  const firstActive = hourCounts.findIndex((c) => c > 0);
  const busiestHours: HourStat[] = [];
  if (firstActive !== -1) {
    const lastActive = hourCounts.length - 1 - [...hourCounts].reverse().findIndex((c) => c > 0);
    for (let h = firstActive; h <= lastActive; h++) {
      busiestHours.push({ hour: h, label: hourLabel(h), count: hourCounts[h] });
    }
  }

  const allHistory = await prisma.appointment.findMany({
    where: { salonId, status: { not: "CANCELLED" } },
    select: { customerPhone: true, date: true },
    orderBy: { date: "asc" },
  });
  const firstSeen = new Map<string, string>();
  const totalByPhone = new Map<string, number>();
  for (const r of allHistory) {
    if (!firstSeen.has(r.customerPhone)) firstSeen.set(r.customerPhone, r.date);
    totalByPhone.set(r.customerPhone, (totalByPhone.get(r.customerPhone) ?? 0) + 1);
  }
  const activePhones = new Set(active.map((r) => r.customerPhone));
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const phone of activePhones) {
    if (range === "all") {
      const total = totalByPhone.get(phone) ?? 0;
      if (total > 1) returningCustomers += 1;
      else newCustomers += 1;
    } else {
      const firstDate = firstSeen.get(phone) ?? todayISO;
      if (firstDate >= (startDateISO as string)) newCustomers += 1;
      else returningCustomers += 1;
    }
  }

  return {
    range,
    totalRevenue,
    totalBookings,
    avgBookingValue,
    cancellationRate,
    revenueSeries,
    topServices,
    teamMemberStats,
    busiestHours,
    newCustomers,
    returningCustomers,
  };
}
