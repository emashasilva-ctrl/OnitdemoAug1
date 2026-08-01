"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { fetchSalonAnalytics } from "@/lib/actions/vendor-analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsRange, SalonAnalytics } from "@/lib/data/vendor-analytics";

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function lkr(value: number) {
  return `LKR ${Math.round(value).toLocaleString()}`;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const revenueConfig: ChartConfig = { revenue: { label: "Revenue", color: "var(--chart-1)" } };
const countConfig: ChartConfig = { count: { label: "Bookings", color: "var(--chart-1)" } };

export function DashboardAnalytics({
  salonId,
  initialAnalytics,
}: {
  salonId: string;
  initialAnalytics: SalonAnalytics;
}) {
  const [range, setRange] = useState<AnalyticsRange>(initialAnalytics.range);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [pending, setPending] = useState(false);

  async function handleRangeChange(next: string) {
    const nextRange = next as AnalyticsRange;
    setRange(nextRange);
    setPending(true);
    const result = await fetchSalonAnalytics(salonId, nextRange);
    setPending(false);
    if (result.success) setAnalytics(result.data);
  }

  const customerTotal = analytics.newCustomers + analytics.returningCustomers;
  const newPct = customerTotal > 0 ? Math.round((analytics.newCustomers / customerTotal) * 100) : 0;
  const returningPct = customerTotal > 0 ? Math.round((analytics.returningCustomers / customerTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Analytics</h2>
        <Select value={range} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as AnalyticsRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("flex flex-col gap-4 transition-opacity", pending && "opacity-60")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total revenue" value={lkr(analytics.totalRevenue)} />
          <StatTile label="Total bookings" value={analytics.totalBookings.toLocaleString()} />
          <StatTile label="Avg. booking value" value={lkr(analytics.avgBookingValue)} />
          <StatTile label="Cancellation rate" value={`${(analytics.cancellationRate * 100).toFixed(1)}%`} />
        </div>

        {analytics.totalBookings === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No bookings in this period yet.
          </p>
        ) : (
          <>
            <ChartCard title="Revenue over time">
              <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
                <BarChart data={analytics.revenueSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(v) => `LKR ${(Number(v) / 1000).toFixed(0)}K`}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Best-selling services">
                <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
                  <BarChart
                    data={analytics.topServices}
                    layout="vertical"
                    margin={{ left: 8, right: 48, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      <LabelList
                        dataKey="revenue"
                        position="right"
                        className="fill-foreground text-xs"
                        formatter={(v: unknown) => lkr(Number(v))}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </ChartCard>

              <ChartCard title="Busiest hours">
                {analytics.busiestHours.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Not enough data yet.</p>
                ) : (
                  <ChartContainer config={countConfig} className="aspect-auto h-64 w-full">
                    <BarChart data={analytics.busiestHours} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ChartContainer>
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {analytics.teamMemberStats.length > 0 && (
                <ChartCard title="Team performance">
                  <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
                    <BarChart data={analytics.teamMemberStats} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tickFormatter={(v) => `LKR ${(Number(v) / 1000).toFixed(0)}K`}
                      />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ChartContainer>
                </ChartCard>
              )}

              <ChartCard title="New vs. returning customers">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">New</p>
                    <p className="mt-1 font-heading text-xl font-semibold text-foreground">
                      {analytics.newCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground">{newPct}% of customers</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Returning</p>
                    <p className="mt-1 font-heading text-xl font-semibold text-foreground">
                      {analytics.returningCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground">{returningPct}% of customers</p>
                  </div>
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
