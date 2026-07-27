"use client";

import { isToday } from "date-fns";
import { toLocalISODate } from "@/lib/time";
import type { VendorCalendarAppointment, RawOpenHours } from "@/lib/data/vendor";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PIXELS_PER_HOUR = 48;
const GRID_HEIGHT = 24 * PIXELS_PER_HOUR;

function closedSegmentsForDay(date: Date, openHours: RawOpenHours[]) {
  const label = DAY_LABELS[date.getDay()];
  const ranges = openHours
    .filter((r) => r.day === label)
    .sort((a, b) => a.openMinutes - b.openMinutes);

  const segments: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.openMinutes > cursor) segments.push({ start: cursor, end: r.openMinutes });
    cursor = Math.max(cursor, r.closeMinutes);
  }
  if (cursor < 1440) segments.push({ start: cursor, end: 1440 });
  return segments;
}

interface PositionedAppointment extends VendorCalendarAppointment {
  column: number;
  columnCount: number;
}

function layoutAppointments(items: VendorCalendarAppointment[]): PositionedAppointment[] {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  const positioned: PositionedAppointment[] = [];
  let cluster: VendorCalendarAppointment[] = [];
  let clusterEnd = -1;

  function flushCluster() {
    if (cluster.length === 0) return;
    const active: { end: number; column: number }[] = [];
    let maxColumn = 0;
    for (const item of cluster) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].end <= item.startMinutes) active.splice(i, 1);
      }
      const usedColumns = new Set(active.map((a) => a.column));
      let column = 0;
      while (usedColumns.has(column)) column++;
      active.push({ end: item.startMinutes + item.durationMins, column });
      maxColumn = Math.max(maxColumn, column);
      positioned.push({ ...item, column, columnCount: 0 });
    }
    const columnCount = maxColumn + 1;
    for (let i = positioned.length - cluster.length; i < positioned.length; i++) {
      positioned[i].columnCount = columnCount;
    }
    cluster = [];
  }

  for (const item of sorted) {
    if (cluster.length > 0 && item.startMinutes >= clusterEnd) flushCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.startMinutes + item.durationMins);
  }
  flushCluster();

  return positioned;
}

export function CalendarHourGrid({
  days,
  appointments,
  openHours,
  onSlotClick,
  onAppointmentClick,
}: {
  days: Date[];
  appointments: VendorCalendarAppointment[];
  openHours: RawOpenHours[];
  onSlotClick: (dateISO: string, minutes: number) => void;
  onAppointmentClick: (appointment: VendorCalendarAppointment) => void;
}) {
  return (
    <div className="flex overflow-x-auto rounded-2xl border border-border">
      <div className="w-14 shrink-0 border-r border-border">
        <div className="h-10 border-b border-border" />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="relative text-right" style={{ height: PIXELS_PER_HOUR }}>
            <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
              {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
            </span>
          </div>
        ))}
      </div>

      {days.map((day) => {
        const dateISO = toLocalISODate(day);
        const dayAppointments = layoutAppointments(
          appointments.filter((a) => a.date === dateISO && a.status !== "CANCELLED")
        );
        const closedSegments = closedSegmentsForDay(day, openHours);

        return (
          <div key={dateISO} className="flex-1 border-r border-border last:border-r-0" style={{ minWidth: 120 }}>
            <div className="flex h-10 flex-col items-center justify-center border-b border-border">
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={isToday(day) ? "font-heading text-sm font-semibold text-primary" : "text-sm text-foreground"}>
                {day.getDate()}
              </p>
            </div>
            <div
              className="relative cursor-pointer"
              style={{ height: GRID_HEIGHT }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const rawMinutes = (y / PIXELS_PER_HOUR) * 60;
                const minutes = Math.min(1425, Math.max(0, Math.round(rawMinutes / 15) * 15));
                onSlotClick(dateISO, minutes);
              }}
            >
              {closedSegments.map((seg, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute inset-x-0 bg-muted/60"
                  style={{ top: (seg.start / 60) * PIXELS_PER_HOUR, height: ((seg.end - seg.start) / 60) * PIXELS_PER_HOUR }}
                />
              ))}
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                  style={{ top: h * PIXELS_PER_HOUR }}
                />
              ))}
              {dayAppointments.map((appt) => (
                <button
                  key={appt.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentClick(appt);
                  }}
                  className="absolute overflow-hidden rounded-md border border-primary/30 bg-primary/15 p-1 text-left text-xs leading-tight text-foreground hover:bg-primary/25"
                  style={{
                    top: (appt.startMinutes / 60) * PIXELS_PER_HOUR,
                    height: Math.max((appt.durationMins / 60) * PIXELS_PER_HOUR, 20),
                    left: `${(appt.column / appt.columnCount) * 100}%`,
                    width: `${100 / appt.columnCount}%`,
                  }}
                >
                  <p className="truncate font-medium">{appt.time} &middot; {appt.label}</p>
                  <p className="truncate text-muted-foreground">{appt.customerName}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
