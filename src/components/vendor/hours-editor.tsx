"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { HoursInput, VendorActionResult } from "@/lib/actions/vendor";
import { minutesToTimeValue, timeValueToMinutes } from "@/lib/time";
import type { RawOpenHours } from "@/lib/data/vendor";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayRange {
  openMinutes: number;
  closeMinutes: number;
}

interface DayState {
  day: string;
  closed: boolean;
  ranges: DayRange[];
}

function buildInitialDays(initialHours: RawOpenHours[]): DayState[] {
  return DAYS.map((day) => {
    const rows = initialHours.filter((h) => h.day === day);
    if (rows.length === 0) {
      return { day, closed: true, ranges: [] };
    }
    return {
      day,
      closed: false,
      ranges: rows
        .map((r) => ({ openMinutes: r.openMinutes, closeMinutes: r.closeMinutes }))
        .sort((a, b) => a.openMinutes - b.openMinutes),
    };
  });
}

function hasInvalidOrOverlappingRanges(ranges: DayRange[]): boolean {
  const sorted = [...ranges].sort((a, b) => a.openMinutes - b.openMinutes);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].openMinutes >= sorted[i].closeMinutes) return true;
    if (i > 0 && sorted[i].openMinutes < sorted[i - 1].closeMinutes) return true;
  }
  return false;
}

export function HoursEditor({
  initialHours,
  onSave,
  onSaved,
}: {
  initialHours: RawOpenHours[];
  onSave: (hours: HoursInput[]) => Promise<VendorActionResult>;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [days, setDays] = useState<DayState[]>(() => buildInitialDays(initialHours));
  const [submitting, setSubmitting] = useState(false);

  function toggleClosed(day: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const nextClosed = !d.closed;
        return {
          ...d,
          closed: nextClosed,
          ranges: nextClosed || d.ranges.length > 0 ? d.ranges : [{ openMinutes: 9 * 60, closeMinutes: 18 * 60 }],
        };
      })
    );
  }

  function addRange(day: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const last = d.ranges[d.ranges.length - 1];
        const start = last ? Math.min(last.closeMinutes + 60, 23 * 60) : 9 * 60;
        const end = Math.min(start + 60, 24 * 60);
        return { ...d, ranges: [...d.ranges, { openMinutes: start, closeMinutes: end }] };
      })
    );
  }

  function removeRange(day: string, index: number) {
    setDays((prev) =>
      prev.map((d) => (d.day === day ? { ...d, ranges: d.ranges.filter((_, i) => i !== index) } : d))
    );
  }

  function updateRange(day: string, index: number, field: keyof DayRange, value: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              ranges: d.ranges.map((r, i) =>
                i === index ? { ...r, [field]: timeValueToMinutes(value) } : r
              ),
            }
          : d
      )
    );
  }

  async function handleSave() {
    for (const d of days) {
      if (d.closed) continue;
      if (d.ranges.length === 0) {
        toast.error(`Add a time range for ${d.day}, or mark it as closed.`);
        return;
      }
      if (hasInvalidOrOverlappingRanges(d.ranges)) {
        toast.error(`Check ${d.day}'s hours — the ranges overlap or a close time is before its open time.`);
        return;
      }
    }

    const hours: HoursInput[] = days
      .filter((d) => !d.closed)
      .flatMap((d) => d.ranges.map((r) => ({ day: d.day, openMinutes: r.openMinutes, closeMinutes: r.closeMinutes })));

    setSubmitting(true);
    const result = await onSave(hours);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Hours updated");
    router.refresh();
    onSaved?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {days.map((d) => (
          <div key={d.day} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="w-12 font-medium text-foreground">{d.day}</p>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={d.closed}
                  onChange={() => toggleClosed(d.day)}
                  className="size-4 rounded border-border"
                />
                Closed all day
              </label>
            </div>

            {!d.closed && (
              <div className="mt-3 flex flex-col gap-2">
                {d.ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Label htmlFor={`open-${d.day}-${i}`} className="sr-only">
                      Open
                    </Label>
                    <input
                      id={`open-${d.day}-${i}`}
                      type="time"
                      value={minutesToTimeValue(r.openMinutes)}
                      onChange={(e) => updateRange(d.day, i, "openMinutes", e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Label htmlFor={`close-${d.day}-${i}`} className="sr-only">
                      Close
                    </Label>
                    <input
                      id={`close-${d.day}-${i}`}
                      type="time"
                      value={minutesToTimeValue(r.closeMinutes)}
                      onChange={(e) => updateRange(d.day, i, "closeMinutes", e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    />
                    {d.ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove range"
                        onClick={() => removeRange(d.day, i)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRange(d.day)}
                  className="w-fit"
                >
                  <Plus className="size-3.5" />
                  Add a break
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : "Save hours"}
      </Button>
    </div>
  );
}
