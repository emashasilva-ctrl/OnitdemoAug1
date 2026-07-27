"use client";

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { toLocalISODate } from "@/lib/time";
import type { VendorCalendarAppointment, RawOpenHours } from "@/lib/data/vendor";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 3;

export function CalendarMonthView({
  monthAnchor,
  appointments,
  openHours,
  onDayClick,
  onAppointmentClick,
}: {
  monthAnchor: Date;
  appointments: VendorCalendarAppointment[];
  openHours: RawOpenHours[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: VendorCalendarAppointment) => void;
}) {
  const start = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map((day) => {
            const dateISO = toLocalISODate(day);
            const dayAppointments = appointments
              .filter((a) => a.date === dateISO && a.status !== "CANCELLED")
              .sort((a, b) => a.startMinutes - b.startMinutes);
            const isClosedAllDay = openHours.filter((r) => r.day === DAY_LABELS[day.getDay()]).length === 0;

            return (
              <button
                key={dateISO}
                type="button"
                onClick={() => onDayClick(day)}
                className={cn(
                  "flex min-h-28 flex-col items-stretch gap-1 border-r border-border p-1.5 text-left last:border-r-0 hover:bg-muted/40",
                  !isSameMonth(day, monthAnchor) && "bg-muted/20 text-muted-foreground",
                  isClosedAllDay && isSameMonth(day, monthAnchor) && "bg-muted/30"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayAppointments.slice(0, MAX_VISIBLE).map((appt) => (
                    <span
                      key={appt.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appt);
                      }}
                      className="truncate rounded bg-primary/15 px-1 py-0.5 text-[11px] text-foreground hover:bg-primary/25"
                    >
                      {appt.time} {appt.customerName}
                    </span>
                  ))}
                  {dayAppointments.length > MAX_VISIBLE && (
                    <span className="text-[11px] text-muted-foreground">
                      +{dayAppointments.length - MAX_VISIBLE} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
