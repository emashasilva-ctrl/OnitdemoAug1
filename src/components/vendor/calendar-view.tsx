"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  format,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCalendarAppointments } from "@/lib/actions/vendor-calendar";
import { toLocalISODate } from "@/lib/time";
import type { VendorCalendarAppointment, RawOpenHours, VendorTeamMember } from "@/lib/data/vendor";
import type { Salon } from "@/lib/types";
import { CalendarMonthView } from "@/components/vendor/calendar-month-view";
import { CalendarHourGrid } from "@/components/vendor/calendar-hour-grid";
import { CalendarStaffDayView } from "@/components/vendor/calendar-staff-day-view";
import { CalendarBookingDialog } from "@/components/vendor/calendar-booking-dialog";
import { CalendarAppointmentDetails } from "@/components/vendor/calendar-appointment-details";

type View = "month" | "week" | "day";
const ALL_STAFF = "__all__";

type Props = {
  kind: "salon";
  venue: Salon;
  initialDate: string;
  initialAppointments: VendorCalendarAppointment[];
  initialOpenHours: RawOpenHours[];
  teamMembers?: VendorTeamMember[];
  teamMemberHours?: Record<string, RawOpenHours[]>;
};

function rangeForView(view: View, date: Date): { start: Date; end: Date } {
  if (view === "day") return { start: date, end: date };
  if (view === "week") {
    return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
  }
  return {
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  };
}

export function CalendarView({
  kind,
  venue,
  initialDate,
  initialAppointments,
  initialOpenHours,
  teamMembers = [],
  teamMemberHours = {},
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(() => parseISO(initialDate));
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [bookingState, setBookingState] = useState<{ date: string; minutes: number } | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<VendorCalendarAppointment | null>(null);
  const [staffFilter, setStaffFilter] = useState(ALL_STAFF);
  const requestIdRef = useRef(0);

  const hasTeamMembers = teamMembers.length > 0;
  const filteredAppointments =
    staffFilter === ALL_STAFF ? appointments : appointments.filter((a) => a.teamMemberId === staffFilter);

  async function loadRange(v: View, date: Date) {
    const { start, end } = rangeForView(v, date);
    const reqId = ++requestIdRef.current;
    setLoading(true);
    const result = await fetchCalendarAppointments(kind, venue.id, toLocalISODate(start), toLocalISODate(end));
    if (reqId !== requestIdRef.current) return;
    setLoading(false);
    if (result.success) setAppointments(result.appointments);
  }

  useEffect(() => {
    // Fetching data in response to view/date changes is the documented valid use
    // of an effect (unlike resetting local state, which should use a key instead).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRange(view, currentDate);
    // loadRange is intentionally omitted: it's a plain function recreated each render, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentDate]);

  function refetch() {
    loadRange(view, currentDate);
  }

  function navigate(direction: 1 | -1) {
    setCurrentDate((d) =>
      view === "day" ? addDays(d, direction) : view === "week" ? addWeeks(d, direction) : addMonths(d, direction)
    );
  }

  function handleSlotClick(dateISO: string, minutes: number) {
    setBookingState({ date: dateISO, minutes });
  }

  function handleDayClick(day: Date) {
    setCurrentDate(day);
    setView("day");
  }

  function handleCancelled(id: string) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" as const } : a)));
    router.refresh();
  }

  function handleTeamMemberAssigned(id: string, teamMemberId: string | null) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, teamMemberId } : a)));
    setDetailsAppointment((prev) => (prev && prev.id === id ? { ...prev, teamMemberId } : prev));
  }

  const weekRange = rangeForView("week", currentDate);
  const headerLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : view === "week"
        ? `${format(weekRange.start, "MMM d")} – ${format(weekRange.end, "MMM d, yyyy")}`
        : format(currentDate, "EEEE, MMMM d, yyyy");

  const gridDays = view === "day" ? [currentDate] : eachDayOfInterval(weekRange);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setJumpOpen(true)} aria-label="Jump to date">
            <CalendarDays className="size-4" />
          </Button>
          <p className="font-heading text-lg font-semibold text-foreground">{headerLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasTeamMembers && (
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STAFF}>All team members</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList variant="line">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {view === "month" ? (
        <CalendarMonthView
          monthAnchor={currentDate}
          appointments={filteredAppointments}
          openHours={initialOpenHours}
          onDayClick={handleDayClick}
          onAppointmentClick={setDetailsAppointment}
        />
      ) : view === "day" && hasTeamMembers && staffFilter === ALL_STAFF ? (
        <CalendarStaffDayView
          day={currentDate}
          appointments={appointments}
          teamMembers={teamMembers}
          hoursByMember={teamMemberHours}
          salonOpenHours={initialOpenHours}
          onSlotClick={handleSlotClick}
          onAppointmentClick={setDetailsAppointment}
        />
      ) : (
        <CalendarHourGrid
          days={gridDays}
          appointments={filteredAppointments}
          openHours={initialOpenHours}
          onSlotClick={handleSlotClick}
          onAppointmentClick={setDetailsAppointment}
        />
      )}

      <Dialog open={jumpOpen} onOpenChange={setJumpOpen}>
        <DialogContent className="w-fit">
          <DialogHeader>
            <DialogTitle>Jump to date</DialogTitle>
          </DialogHeader>
          <DatePicker
            mode="single"
            selected={currentDate}
            onSelect={(d) => {
              if (d) {
                setCurrentDate(d);
                setJumpOpen(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {bookingState && (
        <CalendarBookingDialog
          kind="salon"
          venue={venue}
          open={!!bookingState}
          onOpenChange={(o) => {
            if (!o) setBookingState(null);
          }}
          openHours={initialOpenHours}
          existingAppointments={appointments}
          initialDate={bookingState.date}
          initialMinutes={bookingState.minutes}
          teamMembers={teamMembers}
          onCreated={() => {
            setBookingState(null);
            refetch();
          }}
        />
      )}

      <CalendarAppointmentDetails
        appointment={detailsAppointment}
        open={!!detailsAppointment}
        onOpenChange={(o) => {
          if (!o) setDetailsAppointment(null);
        }}
        kind={kind}
        venueId={venue.id}
        onCancelled={handleCancelled}
        teamMembers={teamMembers}
        onTeamMemberAssigned={handleTeamMemberAssigned}
      />
    </div>
  );
}
