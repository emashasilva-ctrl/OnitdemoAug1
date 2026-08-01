"use client";

import { toLocalISODate } from "@/lib/time";
import { layoutAppointments, closedSegmentsForDay } from "@/components/vendor/calendar-hour-grid";
import type { VendorCalendarAppointment, RawOpenHours, VendorTeamMember } from "@/lib/data/vendor";

const PIXELS_PER_HOUR = 48;
const GRID_HEIGHT = 24 * PIXELS_PER_HOUR;
const UNASSIGNED = "__unassigned__";

export function CalendarStaffDayView({
  day,
  appointments,
  teamMembers,
  hoursByMember,
  salonOpenHours,
  onSlotClick,
  onAppointmentClick,
}: {
  day: Date;
  appointments: VendorCalendarAppointment[];
  teamMembers: VendorTeamMember[];
  hoursByMember: Record<string, RawOpenHours[]>;
  salonOpenHours: RawOpenHours[];
  onSlotClick: (dateISO: string, minutes: number) => void;
  onAppointmentClick: (appointment: VendorCalendarAppointment) => void;
}) {
  const dateISO = toLocalISODate(day);
  const dayAppointments = appointments.filter((a) => a.date === dateISO && a.status !== "CANCELLED");

  const columns = [
    ...teamMembers.map((m) => ({ id: m.id, label: m.name, hours: hoursByMember[m.id]?.length ? hoursByMember[m.id] : salonOpenHours })),
    { id: UNASSIGNED, label: "Unassigned", hours: salonOpenHours },
  ];

  return (
    <div className="flex overflow-x-auto rounded-2xl border border-border">
      <div className="w-14 shrink-0 border-r border-border">
        <div className="h-12 border-b border-border" />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="relative text-right" style={{ height: PIXELS_PER_HOUR }}>
            <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
              {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
            </span>
          </div>
        ))}
      </div>

      {columns.map((col) => {
        const colAppointments = layoutAppointments(
          dayAppointments.filter((a) => (col.id === UNASSIGNED ? !a.teamMemberId : a.teamMemberId === col.id))
        );
        const closedSegments = closedSegmentsForDay(day, col.hours);

        return (
          <div key={col.id} className="flex-1 border-r border-border last:border-r-0" style={{ minWidth: 160 }}>
            <div className="flex h-12 flex-col items-center justify-center border-b border-border px-1 text-center">
              <p className="truncate text-sm font-medium text-foreground">{col.label}</p>
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
              {colAppointments.map((appt) => (
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
